import type {
  IAskQa,
  ICaseRecipe,
  IOpenQuestion,
  IRecipeBook,
  IRunCoordinator,
  IVideoRecorder,
  IWalkRun,
  QaOutcome,
} from './types';
import type {
  Harness,
  IAttachDevice,
  IDevicePort,
  IExploredScreen,
  IExploreFinish,
  IQaQuestion,
  IStepFinding,
  IStepReport,
  McpHost,
} from '@/harness';
import type { AgentRunner } from '@/main/classes/agents/AgentRunner';
import type { LiveStream } from '@/main/classes/devices/LiveStream';
import type { IDeviceDriver } from '@/main/classes/devices/types';
import type { IVariableValue, ShrinkImage } from '@/main/types';
import type {
  IAndroidSetup,
  IFlatStep,
  IIosSetup,
  IRunEvent,
  IRunInFlight,
  IRunQuestion,
  IRunVideo,
  IStartRun,
  IStepAction,
  IStepOutcome,
  IVariableBrief,
  IViewport,
  QaReply,
  RunAnswer,
  RunFailure,
  TargetKind,
} from '@/shared/types';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { mcpConfigWith } from '@/harness';
import { WEB_DRIVER } from '@/main/classes/devices/WebDriver/constants';
import { ARCHIVE } from '@/main/classes/storage/Archive/constants';
import { agentFailure } from '@/main/library';
import { EXPLORATION } from '@/shared/constants';
import { RUN_WALK, UNWALKED } from './constants';
import {
  answerWords,
  bookWith,
  casesOf,
  driverFor,
  earlyFinish,
  exploredOutcome,
  failureOf,
  findingAnswer,
  followRunEvent,
  hiddenValues,
  keptBugId,
  outcomeOfReport,
  privateUrlOf,
  proofHolds,
  readBook,
  recipeFor,
  recipeOf,
  recordedAction,
  replayedOutcome,
  unwalkedOutcome,
  variablePort,
} from './library';

/** Walks a plan on a real device: the agent drives, the requirement judges. */
export class RunCoordinator {
  private readonly runner: AgentRunner;
  private readonly findCommand: (agentId: string) => Promise<string | null>;
  private readonly findAndroid: IRunCoordinator['findAndroid'];
  private readonly findIos: IRunCoordinator['findIos'];
  private readonly dataRoot: string;
  private readonly live: LiveStream;
  private readonly tools: McpHost;
  private readonly harness: Harness;
  private readonly onEvent: (event: IRunEvent) => void;
  private readonly shrink: ShrinkImage | null;
  private readonly recorder: IVideoRecorder | null;
  private readonly variablesOf: (projectId: string) => Promise<IVariableValue[]>;
  private readonly keepVariable: NonNullable<IRunCoordinator['keepVariable']>;
  private readonly askWaitMs: number;
  private readonly stopping = new Set<string>();
  private readonly walking = new Set<string>();
  private readonly paused = new Set<string>();
  private readonly drivers = new Map<string, IDeviceDriver>();
  private readonly inFlightRuns = new Map<string, IRunInFlight>();
  private readonly viewports = new Map<string, IViewport>();
  private readonly questions = new Map<string, IOpenQuestion>();

  public constructor(props: IRunCoordinator) {
    this.runner = props.runner;
    this.findCommand = props.findCommand;
    this.findAndroid = props.findAndroid;
    this.findIos = props.findIos;
    this.dataRoot = props.dataRoot;
    this.live = props.live;
    this.tools = props.tools;
    this.harness = props.harness;
    this.onEvent = props.onEvent;
    this.shrink = props.shrink ?? null;
    this.recorder = props.recorder ?? null;
    this.variablesOf = props.variablesOf ?? (() => Promise.resolve([]));
    this.keepVariable = props.keepVariable ?? (() => Promise.resolve(false));
    this.askWaitMs = props.askWaitMs ?? RUN_WALK.askWaitMs;
  }

  public async start(run: IStartRun): Promise<void> {
    if (this.walking.has(run.workspaceId)) return;

    const command = await this.findCommand(run.agentId);

    if (!command) {
      this.emit({
        kind: 'failed',
        workspaceId: run.workspaceId,
        failure: { reason: 'agent-missing', agentId: run.agentId },
      });

      return;
    }

    const android = run.target.kind === 'android' ? await this.findAndroid() : null;
    const ios = run.target.kind === 'ios' ? await this.findIos() : null;
    const missing = this.whatIsMissing({ kind: run.target.kind, android, ios });

    if (missing !== null) {
      this.emit({ kind: 'failed', workspaceId: run.workspaceId, failure: missing });

      return;
    }

    this.walking.add(run.workspaceId);
    this.inFlightRuns.set(run.workspaceId, {
      workspaceId: run.workspaceId,
      runId: run.runId,
      startedAtMs: Date.now(),
      doingIndex: -1,
      streamUrl: null,
      outcomes: [],
      isPaused: false,
      costUsd: null,
      findings: [],
      agentId: run.agentId,
      model: run.model,
      targetKind: run.target.kind,
      isExploring: run.mode === 'explore',
      question: null,
      asked: [],
    });

    try {
      await this.walk({
        ...run,
        values:
          run.projectId === undefined
            ? []
            : await this.variablesOf(run.projectId).catch(() => []),
        command,
        shotDir: join(this.dataRoot, ARCHIVE.runs, run.workspaceId, run.runId),
        profileDir: join(this.dataRoot, RUN_WALK.profiles, run.workspaceId),
        sdkRoot: android?.sdkRoot ?? '',
        avd: android?.avd ?? '',
        idb: ios?.idb ?? '',
        udid: ios?.udid ?? '',
      });
    } finally {
      this.questions.get(run.workspaceId)?.settle({ kind: 'stopped' });
      this.walking.delete(run.workspaceId);
      this.inFlightRuns.delete(run.workspaceId);
      this.stopping.delete(run.workspaceId);
      this.paused.delete(run.workspaceId);
      this.viewports.delete(run.workspaceId);
    }
  }

  public stop(workspaceId: string): void {
    this.paused.delete(workspaceId);

    if (!this.walking.has(workspaceId)) return;

    this.stopping.add(workspaceId);
    this.questions.get(workspaceId)?.settle({ kind: 'stopped' });
    this.runner.cancel(workspaceId);
    void this.drivers.get(workspaceId)?.close();
  }

  public setPaused(props: { workspaceId: string; isPaused: boolean }): void {
    if (props.isPaused) this.paused.add(props.workspaceId);
    else this.paused.delete(props.workspaceId);

    const run = this.inFlightRuns.get(props.workspaceId);

    if (run)
      this.inFlightRuns.set(props.workspaceId, { ...run, isPaused: props.isPaused });
  }

  /** Hands the QA's reply to the question a run's agent waits on; a reply to a question no longer waiting, or one with nothing in it, changes nothing. */
  public answer(props: {
    workspaceId: string;
    questionId: string;
    reply: QaReply;
  }): void {
    const { workspaceId, questionId, reply } = props;
    const open = this.questions.get(workspaceId);

    if (open?.question.id !== questionId) return;

    if ((reply.kind === 'said' ? reply.text.trim() : reply.value).length === 0) return;

    open.settle(reply);
  }

  /** Resizes the device of a run under way, for the cases still to come too; the next run starts at the workspace's size. */
  public async resize(props: {
    workspaceId: string;
    viewport: IViewport;
  }): Promise<void> {
    if (!this.walking.has(props.workspaceId)) return;

    this.viewports.set(props.workspaceId, props.viewport);
    await this.drivers.get(props.workspaceId)?.resize(props.viewport);
  }

  /** Streams a run's device at full detail while the QA watches it up close. */
  public async focus(props: { workspaceId: string; isFocused: boolean }): Promise<void> {
    await this.drivers.get(props.workspaceId)?.focus(props.isFocused);
  }

  /** The runs still walking, as they stand: a page that opened mid-run picks them up from here. */
  public inFlight(): IRunInFlight[] {
    return [...this.inFlightRuns.values()];
  }

  private whatIsMissing(props: {
    kind: TargetKind;
    android: IAndroidSetup | null;
    ios: IIosSetup | null;
  }): RunFailure | null {
    if (props.kind === 'android' && props.android === null)
      return { reason: 'no-emulator' };

    if (props.kind === 'ios' && props.ios === null) return { reason: 'no-simulator' };

    return null;
  }

  private async walk(run: IWalkRun): Promise<void> {
    this.stopping.delete(run.workspaceId);

    let driver: IDeviceDriver | null = null;

    try {
      driver = driverFor(this.shrink === null ? { run } : { run, shrink: this.shrink });
      this.drivers.set(run.workspaceId, driver);
      await mkdir(run.shotDir, { recursive: true });
      await driver.open();
      this.tools.attach({
        workspaceId: run.workspaceId,
        driver: variablePort({ device: driver, values: run.values }),
      });
      await this.watch({ run, driver });
    } catch (reason) {
      const recorded = (await driver?.stopRecording().catch(() => null)) ?? null;

      await driver?.close();
      await this.keepNetwork({ run, driver });
      this.drivers.delete(run.workspaceId);
      this.tools.detach(run.workspaceId);
      this.live.end(run.workspaceId);
      await this.finish({
        run,
        ended: this.stopping.has(run.workspaceId)
          ? { kind: 'done', workspaceId: run.workspaceId }
          : { kind: 'failed', workspaceId: run.workspaceId, failure: failureOf(reason) },
        recorded,
      });

      return;
    }

    const broke = await (
      run.mode === 'explore'
        ? this.explore({ run, driver })
        : this.walkSteps({ run, driver })
    ).then(
      (failure) => failure,
      (reason: unknown) =>
        this.stopping.has(run.workspaceId) ? null : failureOf(reason),
    );

    const recorded = await driver.stopRecording().catch(() => null);

    await driver.close();
    await this.keepNetwork({ run, driver });
    this.drivers.delete(run.workspaceId);
    this.tools.detach(run.workspaceId);
    this.live.end(run.workspaceId);
    await this.finish({
      run,
      ended:
        broke === null
          ? { kind: 'done', workspaceId: run.workspaceId }
          : { kind: 'failed', workspaceId: run.workspaceId, failure: broke },
      recorded,
    });
  }

  /** Keeps the requests a browser saw beside the run's video, each address with its secrets left out; a phone keeps none. */
  private async keepNetwork(props: {
    run: IWalkRun;
    driver: IDeviceDriver | null;
  }): Promise<void> {
    const entries = props.driver?.network?.() ?? [];

    if (entries.length === 0) return;

    await writeFile(
      join(props.run.shotDir, ARCHIVE.network),
      JSON.stringify(
        entries.map((entry) => ({
          ...entry,
          url: privateUrlOf({ url: entry.url, values: props.run.values }),
        })),
      ),
      'utf8',
    ).catch(() => undefined);
  }

  /** Says how the run ended, then hands over its recording: the phone's own, or the one made from the live stream once its file is whole. */
  private async finish(props: {
    run: IWalkRun;
    ended: IRunEvent;
    recorded: IRunVideo | null;
  }): Promise<void> {
    const { run, ended, recorded } = props;

    this.emit(ended);

    const video =
      recorded ?? (await this.recorder?.stop(run.workspaceId).catch(() => null));

    if (video)
      this.emit({ kind: 'video', workspaceId: run.workspaceId, runId: run.runId, video });
  }

  /** Walks the cases in order, and ends once each case's agent said what it cost, or after a short wait. */
  private async walkSteps(props: {
    run: IWalkRun;
    driver: IDeviceDriver;
  }): Promise<RunFailure | null> {
    const { run, driver } = props;
    const costs: Promise<void>[] = [];
    const filed: string[] = [];
    const book = await this.readBook(run.workspaceId);
    const recorded: ICaseRecipe[] = [];

    try {
      for (const [position, steps] of casesOf(run.steps).entries()) {
        await this.holdWhilePaused(run.workspaceId);

        if (this.stopping.has(run.workspaceId)) break;

        if (position > 0) await driver.restart().catch(() => undefined);

        if (this.stopping.has(run.workspaceId)) break;

        const recipe =
          run.mode === 'agent'
            ? null
            : recipeFor({
                book,
                steps: steps.map(({ step }) => step),
                targetKind: run.target.kind,
              });
        const replayed =
          recipe === null ? null : await this.replayCase({ run, driver, steps, recipe });

        if (replayed === 'stopped') break;

        if (replayed === 'replayed') continue;

        if (replayed === 'diverged') {
          await driver.restart().catch(() => undefined);

          if (this.stopping.has(run.workspaceId)) break;
        }

        const walked = await this.walkCase({
          run,
          driver,
          steps,
          costs,
          filed,
          recorded,
          isHealing: replayed === 'diverged',
        });

        if (walked === false) break;

        if (walked !== true) return walked;
      }

      return null;
    } finally {
      if (recorded.length > 0)
        await this.writeBook({
          workspaceId: run.workspaceId,
          book: bookWith({ book, recipes: recorded }),
        }).catch(() => undefined);

      await Promise.race([
        Promise.all(costs),
        new Promise((wake) => setTimeout(wake, RUN_WALK.costsWaitMs)),
      ]);
    }
  }

  /** One agent turn per case, in a session of its own, kept as a recipe once every step passed with its proof: true goes on, false stops, a failure stops and says why. */
  private async walkCase(props: {
    run: IWalkRun;
    driver: IDeviceDriver;
    steps: { step: IFlatStep; index: number }[];
    costs: Promise<void>[];
    filed: string[];
    recorded: ICaseRecipe[];
    isHealing: boolean;
  }): Promise<boolean | RunFailure> {
    const { run, driver } = props;
    const { workspaceId } = run;
    const pending = [...props.steps];
    const actions = new Map<number, IStepAction[]>();
    const proofs = new Map<number, string>();
    let began = Date.now();
    let isOver = false;
    let isAnsweredForThisRun = false;
    let over: () => void = () => undefined;
    const caseOver = new Promise<null>((resolve) => {
      over = () => {
        resolve(null);
      };
    });

    const endCase = (said: string) => {
      isOver = true;
      over();
      setImmediate(() => {
        this.tools.detach(workspaceId);
        this.runner.cancel(workspaceId);
      });

      return said;
    };

    const unwalked = (verdict: 'skipped' | 'blocked') => {
      const at = Date.now();

      for (const [position, { step, index }] of pending.entries())
        this.emit({
          kind: 'step',
          outcome: unwalkedOutcome({
            step,
            index,
            workspaceId,
            verdict: position === 0 ? verdict : 'skipped',
            why:
              position === 0 && verdict === 'blocked'
                ? UNWALKED.unreported
                : UNWALKED.skipped,
            at,
          }),
        });

      pending.length = 0;
    };

    const onReport = async (report: IStepReport): Promise<string> => {
      const walking = pending[0];

      if (walking === undefined)
        return 'Every step of this case is reported. End your turn now.';

      if (report.step !== walking.step.numberInCase)
        return `Step ${String(walking.step.numberInCase)} is not reported yet: carry it out and report it first.`;

      pending.shift();

      if (report.note.length > 0)
        this.emit({ kind: 'note', workspaceId, text: report.note });

      const shot = await driver.shoot(
        join(run.shotDir, `step-${String(walking.index + 1)}.jpg`),
      );
      const at = Date.now();

      const kept =
        report.verdict === 'failed'
          ? keptBugId({ asked: report.sameAs, known: run.bugs ?? [] })
          : null;
      const outcome = outcomeOfReport({
        report: { ...report, sameAs: kept ?? undefined },
        step: walking.step,
        index: walking.index,
        workspaceId,
        tookMs: at - began,
        at,
        shot,
      });

      this.emit({
        kind: 'step',
        outcome: props.isHealing ? { ...outcome, by: 'healed' } : outcome,
      });

      if (report.verdict === 'passed')
        proofs.set(walking.step.numberInCase, report.proof);

      if (report.verdict === 'failed' && report.title.length > 0)
        props.filed.push(report.title);

      if (report.verdict !== 'passed') {
        unwalked('skipped');

        return endCase('Filed. The case stops here because this step did not hold up.');
      }

      const next = pending[0];

      if (next === undefined) {
        const recipe = recipeOf({
          steps: props.steps.map(({ step }) => step),
          targetKind: run.target.kind,
          actions,
          proofs,
          runId: run.runId,
          at,
        });

        if (recipe !== null && !isAnsweredForThisRun) props.recorded.push(recipe);

        return endCase('Filed. That was the last step of this case.');
      }

      await this.holdWhilePaused(workspaceId);

      if (this.stopping.has(workspaceId))
        return 'The QA stopped the run: end your turn now.';

      began = Date.now();
      this.emit({ kind: 'doing', workspaceId, index: next.index });

      return `Filed. Next is step ${String(next.step.numberInCase)}: ${next.step.action}`;
    };

    let findings = 0;

    const onFinding = async (finding: IStepFinding): Promise<string> => {
      const walking = pending[0];

      if (walking === undefined || isOver) return 'This case is over: end your turn now.';

      findings += 1;
      props.filed.push(finding.title);

      const kept = keptBugId({ asked: finding.sameAs, known: run.bugs ?? [] });
      const shot = await driver.shoot(
        join(run.shotDir, `finding-${String(walking.index + 1)}-${String(findings)}.jpg`),
      );

      this.emit({
        kind: 'finding',
        workspaceId,
        finding: {
          ...finding,
          sameAs: kept ?? undefined,
          caseId: walking.step.caseId,
          stepNumber: walking.step.numberInCase,
          index: walking.index,
          action: walking.step.action,
          at: Date.now(),
          screenshot: shot?.dataUrl ?? null,
          shotFile: shot?.file ?? null,
        },
      });

      return findingAnswer({
        asked: finding.sameAs,
        kept,
        carryOn: `Carry on with step ${String(walking.step.numberInCase)}.`,
      });
    };

    const onAsk = async (question: IQaQuestion): Promise<string> => {
      const walking = pending[0];

      if (walking === undefined || isOver) return 'This case is over: end your turn now.';

      const { words, answer } = await this.askQa({
        run,
        asked: question,
        at: {
          caseId: walking.step.caseId,
          stepNumber: walking.step.numberInCase,
          action: walking.step.action,
        },
        carryOn: `Carry on with step ${String(walking.step.numberInCase)}.`,
        noAnswer:
          'Carry on without it if you can, or report the step blocked and say what you needed.',
      });

      if (answer?.kind === 'secret' && !answer.isKept) isAnsweredForThisRun = true;

      return isOver ? 'This case is over: end your turn now.' : words;
    };

    const mcpConfig = this.tools.mcpConfigFor(
      workspaceId,
      this.askWaitMs + RUN_WALK.toolMarginMs,
    );

    if (mcpConfig === null)
      throw new Error('The device tools are not up, so the agent cannot act.');

    const design = this.harness.designAccess(
      pending.some(({ step }) => step.frame !== undefined) ? (run.design ?? null) : null,
    );
    const first = pending[0];

    if (first !== undefined)
      this.emit({ kind: 'doing', workspaceId, index: first.index });

    const device = variablePort({ device: driver, values: run.values });
    const port: IDevicePort = {
      describe: () => device.describe(),
      inspect: (target) => device.inspect(target),
      glance: () => device.glance(),
      motion: () => device.motion(),
      act: async (action) => {
        await device.act(action);

        const walking = pending[0];

        if (walking !== undefined)
          actions.set(walking.step.numberInCase, [
            ...(actions.get(walking.step.numberInCase) ?? []),
            recordedAction({
              action,
              found: driver.resolution?.() ?? null,
              values: run.values,
            }),
          ]);
      },
    };

    this.tools.attach({ workspaceId, driver: port, onReport, onFinding, onAsk });

    const screen = await device.describe().catch(() => '');

    if (this.stopping.has(workspaceId)) return false;

    const asking = this.runner.ask({
      workspaceId,
      agentId: run.agentId,
      command: run.command,
      model: run.model,
      sessionId: null,
      systemPrompt: this.harness.run({
        target: run.target,
        viewport: this.viewports.get(workspaceId) ?? run.viewport ?? WEB_DRIVER.viewport,
        language: run.language,
      }),
      mcpConfig:
        mcpConfigWith({ config: mcpConfig, servers: design.servers }) ?? mcpConfig,
      allowedTools: [
        ...this.harness.toolsFor('runner').allowedTools,
        ...design.allowedTools,
      ],
      prompt: this.harness.walk({
        steps: pending.map(({ step }) => step),
        screen,
        language: run.language,
        filed: [...props.filed],
        known: run.bugs ?? [],
        variables: run.values.map(({ name, description }) => ({ name, description })),
        design: run.design ?? null,
      }),
    });

    props.costs.push(
      asking.then(
        ({ costUsd }) => {
          if (costUsd !== null) this.emit({ kind: 'cost', workspaceId, costUsd });
        },
        () => undefined,
      ),
    );

    const asked = await Promise.race([asking, caseOver]);

    if (this.stopping.has(workspaceId)) return false;

    if (isOver || asked === null) return true;

    const failed = agentFailure(asked);

    if (failed !== null) return failed;

    unwalked('blocked');

    return true;
  }

  /** Explores the app with no plan, one agent alone until it finishes or its time runs out: each screen it notes is a step of one case, and each bug it files a finding. */
  private async explore(props: {
    run: IWalkRun;
    driver: IDeviceDriver;
  }): Promise<RunFailure | null> {
    const { run, driver } = props;
    const { workspaceId } = run;
    const minutes = run.minutes ?? EXPLORATION.minutes;
    let endsAt = Date.now() + minutes * 60_000;
    let late: NodeJS.Timeout | undefined;
    const device = variablePort({ device: driver, values: run.values });
    let screens = 0;
    let findings = 0;
    let current = { number: 0, name: '' };
    let last = Date.now();
    let isOver = false;
    let isPushed = false;
    let over: () => void = () => undefined;
    const finished = new Promise<null>((resolve) => {
      over = () => {
        resolve(null);
      };
    });

    const end = (said: string) => {
      isOver = true;
      over();
      setImmediate(() => {
        this.tools.detach(workspaceId);
        this.runner.cancel(workspaceId);
      });

      return said;
    };

    const onScreen = async (screen: IExploredScreen): Promise<string> => {
      if (isOver) return 'The exploration is over: end your turn now.';

      screens += 1;

      const number = screens;
      const shot = await driver.shoot(join(run.shotDir, `screen-${String(number)}.jpg`));
      const at = Date.now();

      current = { number, name: screen.name };
      this.emit({
        kind: 'step',
        outcome: exploredOutcome({
          workspaceId,
          screen,
          number,
          tookMs: at - last,
          at,
          shot,
        }),
      });
      last = at;

      return `Noted screen ${String(number)}: ${screen.name}. Carry on exploring.`;
    };

    const onFinding = async (finding: IStepFinding): Promise<string> => {
      if (isOver) return 'The exploration is over: end your turn now.';

      findings += 1;

      const kept = keptBugId({ asked: finding.sameAs, known: run.bugs ?? [] });
      const shot = await driver.shoot(
        join(run.shotDir, `finding-explore-${String(findings)}.jpg`),
      );

      this.emit({
        kind: 'finding',
        workspaceId,
        finding: {
          ...finding,
          sameAs: kept ?? undefined,
          caseId: EXPLORATION.caseId,
          stepNumber: current.number,
          index: Math.max(current.number - 1, 0),
          action: current.name,
          at: Date.now(),
          screenshot: shot?.dataUrl ?? null,
          shotFile: shot?.file ?? null,
        },
      });

      return findingAnswer({
        asked: finding.sameAs,
        kept,
        carryOn: 'Carry on exploring.',
      });
    };

    const onFinish = (finish: IExploreFinish): Promise<string> => {
      if (isOver) return Promise.resolve('The exploration is over: end your turn now.');

      const early = isPushed
        ? null
        : earlyFinish({ leftMs: endsAt - Date.now(), totalMs: minutes * 60_000 });

      if (early !== null) {
        isPushed = true;

        return Promise.resolve(early);
      }

      this.emit({ kind: 'explored', workspaceId, ...finish });

      return Promise.resolve(end('Thank you. End your turn now, with no summary.'));
    };

    const armLate = () => {
      clearTimeout(late);
      late = setTimeout(
        () => {
          if (!isOver) end('');
        },
        endsAt - Date.now() + RUN_WALK.exploreGraceMs,
      );
    };

    const onAsk = async (question: IQaQuestion): Promise<string> => {
      if (isOver) return 'The exploration is over: end your turn now.';

      if (Date.now() >= endsAt) return 'Time is up: call finish now with what you saw.';

      const began = Date.now();

      clearTimeout(late);

      const { words } = await this.askQa({
        run,
        asked: question,
        at: {
          caseId: EXPLORATION.caseId,
          stepNumber: current.number,
          action: current.name,
        },
        carryOn: 'Carry on exploring.',
        noAnswer: 'Explore what you can reach without it.',
      });

      if (isOver || this.stopping.has(workspaceId))
        return 'The exploration is over: end your turn now.';

      endsAt += Date.now() - began;
      this.tools.attach({ ...attached, endsAt });
      armLate();

      return words;
    };

    const mcpConfig = this.tools.mcpConfigFor(
      workspaceId,
      this.askWaitMs + RUN_WALK.toolMarginMs,
    );

    if (mcpConfig === null)
      throw new Error('The device tools are not up, so the agent cannot act.');

    const attached: IAttachDevice = {
      workspaceId,
      driver: device,
      purpose: 'explore',
      endsAt,
      onScreen,
      onFinding,
      onFinish,
      onAsk,
    };

    this.tools.attach(attached);

    const screen = await device.describe().catch(() => '');

    if (this.stopping.has(workspaceId)) return null;

    const asking = this.runner.ask({
      workspaceId,
      agentId: run.agentId,
      command: run.command,
      model: run.model,
      sessionId: null,
      systemPrompt: this.harness.explore({
        target: run.target,
        viewport: this.viewports.get(workspaceId) ?? run.viewport ?? WEB_DRIVER.viewport,
        language: run.language,
        minutes,
      }),
      mcpConfig,
      allowedTools: this.harness.toolsFor('explorer').allowedTools,
      prompt: this.harness.startExploring({
        minutes,
        screen,
        variables: run.values.map(({ name, description }) => ({ name, description })),
        known: run.bugs ?? [],
      }),
    });
    const cost = asking.then(
      ({ costUsd }) => {
        if (costUsd !== null) this.emit({ kind: 'cost', workspaceId, costUsd });
      },
      () => undefined,
    );
    armLate();

    const asked = await Promise.race([asking, finished]);

    clearTimeout(late);
    await Promise.race([
      cost,
      new Promise((wake) => setTimeout(wake, RUN_WALK.costsWaitMs)),
    ]);

    if (this.stopping.has(workspaceId) || isOver || asked === null) return null;

    return agentFailure(asked);
  }

  private async watch(props: { run: IWalkRun; driver: IDeviceDriver }): Promise<void> {
    const { run, driver } = props;
    const { workspaceId } = run;
    const isStreaming = await driver.stream((jpeg) => {
      const viewport =
        this.viewports.get(workspaceId) ?? run.viewport ?? WEB_DRIVER.viewport;

      this.live.push({ workspaceId, jpeg, ratio: viewport.width / viewport.height });
    });
    const url = this.live.urlFor(workspaceId);

    if (!isStreaming || url === null) {
      await driver.record(run.shotDir).catch(() => false);

      return;
    }

    this.emit({ kind: 'streaming', workspaceId, url });
    await this.recorder
      ?.start({ workspaceId, runId: run.runId, url })
      .catch(() => undefined);
  }

  /** Walks a case again without the agent, the way its recipe says, checking each step's proof; its steps are told only once the whole case held. */
  private async replayCase(props: {
    run: IWalkRun;
    driver: IDeviceDriver;
    steps: { step: IFlatStep; index: number }[];
    recipe: ICaseRecipe;
  }): Promise<'replayed' | 'diverged' | 'stopped'> {
    const { run, driver, recipe } = props;
    const { workspaceId } = run;
    const outcomes: IStepOutcome[] = [];
    const device = variablePort({ device: driver, values: run.values });

    for (const { step, index } of props.steps) {
      await this.holdWhilePaused(workspaceId);

      if (this.stopping.has(workspaceId)) return 'stopped';

      const kept = recipe.steps.find(({ number }) => number === step.numberInCase);

      if (kept === undefined) return 'diverged';

      this.emit({ kind: 'doing', workspaceId, index });

      const began = Date.now();
      const isDone = await (async () => {
        for (const action of kept.actions) await device.act(action);
      })().then(
        () => true,
        () => false,
      );

      if (!isDone || !(await this.proofShows({ device, proof: kept.proof })))
        return 'diverged';

      const shot = await driver.shoot(join(run.shotDir, `step-${String(index + 1)}.jpg`));
      const at = Date.now();

      outcomes.push(
        replayedOutcome({
          step,
          index,
          workspaceId,
          proof: kept.proof,
          tookMs: at - began,
          at,
          shot,
        }),
      );
    }

    for (const outcome of outcomes) this.emit({ kind: 'step', outcome });

    return 'replayed';
  }

  private async proofShows(props: {
    device: IDevicePort;
    proof: string;
  }): Promise<boolean> {
    for (let tries = 0; tries < RUN_WALK.proofChecks; tries += 1) {
      const screen = await props.device.describe().catch(() => '');

      if (proofHolds({ screen, proof: props.proof })) return true;

      await new Promise((wake) => setTimeout(wake, RUN_WALK.proofWaitMs));
    }

    return false;
  }

  private bookFile(workspaceId: string): string {
    return join(this.dataRoot, ARCHIVE.workspaces, workspaceId, ARCHIVE.recipes);
  }

  private async readBook(workspaceId: string): Promise<IRecipeBook> {
    return readBook(await readFile(this.bookFile(workspaceId), 'utf8').catch(() => null));
  }

  private async writeBook(props: {
    workspaceId: string;
    book: IRecipeBook;
  }): Promise<void> {
    const file = this.bookFile(props.workspaceId);

    if ((await stat(dirname(file)).catch(() => null))?.isDirectory() !== true) return;

    await writeFile(file, JSON.stringify(props.book, null, 2));
  }

  /** Shows the QA what the agent asked at the step it is on, and waits with the agent's clock held for their reply, the wait's end or a stop: the agent hears it in words, and a secret by its name alone. */
  private async askQa(
    props: IAskQa,
  ): Promise<{ words: string; answer: RunAnswer | null }> {
    const { run, asked, at } = props;
    const { workspaceId } = run;
    const flight = this.inFlightRuns.get(workspaceId);

    if (this.stopping.has(workspaceId) || flight === undefined)
      return {
        words: answerWords({ ...props, answer: { kind: 'stopped' } }),
        answer: null,
      };

    const { secret } = asked;

    if (
      secret !== null &&
      run.values.some(({ name }) => name === secret.name) &&
      !flight.asked.some(
        ({ answer }) => answer.kind === 'secret' && answer.name === secret.name,
      )
    )
      return {
        words: `\${${secret.name}} is a variable of the project already: type it as written instead of asking for it.`,
        answer: null,
      };

    const number = flight.asked.length + 1;
    const askedAtMs = Date.now();
    const question: IRunQuestion = {
      id: `q-${String(number)}`,
      question: asked.question,
      options: asked.options,
      isSecret: secret !== null,
      secret: secret ?? {
        name: `QA_ANSWER_${String(number)}`,
        description: asked.question,
      },
      ...at,
      askedAtMs,
      waitsUntilMs: askedAtMs + this.askWaitMs,
    };

    this.runner.hold(workspaceId);

    const outcome = await new Promise<QaOutcome>((settle) => {
      const timer = setTimeout(() => {
        this.questions.get(workspaceId)?.settle({ kind: 'unanswered' });
      }, this.askWaitMs);

      this.questions.set(workspaceId, {
        question,
        settle: (ended) => {
          clearTimeout(timer);
          this.questions.delete(workspaceId);
          settle(ended);
        },
      });
      this.emit({ kind: 'asked', workspaceId, question });
    });

    this.runner.release(workspaceId);

    const answer = await this.answerOf({ run, outcome, variable: question.secret });

    this.emit({
      kind: 'answered',
      workspaceId,
      asked: {
        id: question.id,
        question: question.question,
        caseId: at.caseId,
        stepNumber: at.stepNumber,
        answer,
        askedAtMs,
        answeredAtMs: Date.now(),
      },
    });

    return { words: answerWords({ ...props, answer }), answer };
  }

  /** The QA's reply as the run keeps it: their words with any variable's value read back as its name, or a secret typed from now on as `variable`, and kept in the project when they asked and it could be. */
  private async answerOf(props: {
    run: IWalkRun;
    outcome: QaOutcome;
    variable: IVariableBrief;
  }): Promise<RunAnswer> {
    const { run, outcome } = props;

    if (outcome.kind === 'unanswered' || outcome.kind === 'stopped') return outcome;

    if (outcome.kind === 'said')
      return {
        kind: 'said',
        text: hiddenValues({ text: outcome.text.trim(), values: run.values }),
      };

    const variable: IVariableValue = { ...props.variable, value: outcome.value };
    const isKept =
      outcome.isKept && run.projectId !== undefined
        ? await this.keepVariable({ projectId: run.projectId, variable }).catch(
            () => false,
          )
        : false;
    const known = run.values.findIndex(({ name }) => name === variable.name);

    if (known === -1) run.values.push(variable);
    else run.values.splice(known, 1, variable);

    return { kind: 'secret', name: variable.name, isKept };
  }

  private async holdWhilePaused(workspaceId: string): Promise<void> {
    while (this.paused.has(workspaceId) && !this.stopping.has(workspaceId))
      await new Promise((wake) => setTimeout(wake, RUN_WALK.holdMs));
  }

  private emit(event: IRunEvent): void {
    const workspaceId =
      event.kind === 'step' ? event.outcome.workspaceId : event.workspaceId;
    const run = this.inFlightRuns.get(workspaceId);

    if (run) this.inFlightRuns.set(workspaceId, followRunEvent({ run, event }));

    this.onEvent(event);
  }
}
