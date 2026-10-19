import type { IRunCoordinator, IWalkRun } from './types';
import type { Harness, IStepFinding, IStepReport, McpHost } from '@/harness';
import type { AgentRunner } from '@/main/classes/agents/AgentRunner';
import type { LiveStream } from '@/main/classes/devices/LiveStream';
import type { IDeviceDriver } from '@/main/classes/devices/types';
import type { ShrinkImage } from '@/main/types';
import type {
  IAndroidSetup,
  IFlatStep,
  IIosSetup,
  IRunEvent,
  IRunInFlight,
  IStartRun,
  IViewport,
  RunFailure,
  TargetKind,
} from '@/shared/types';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { WEB_DRIVER } from '@/main/classes/devices/WebDriver/constants';
import { ARCHIVE } from '@/main/classes/storage/Archive/constants';
import { agentFailure } from '@/main/library';
import { RUN_WALK, UNWALKED } from './constants';
import {
  casesOf,
  driverFor,
  failureOf,
  followRunEvent,
  outcomeOfReport,
  unwalkedOutcome,
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
  private readonly stopping = new Set<string>();
  private readonly walking = new Set<string>();
  private readonly paused = new Set<string>();
  private readonly drivers = new Map<string, IDeviceDriver>();
  private readonly inFlightRuns = new Map<string, IRunInFlight>();
  private readonly viewports = new Map<string, IViewport>();

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
    });

    try {
      await this.walk({
        ...run,
        command,
        shotDir: join(this.dataRoot, ARCHIVE.runs, run.workspaceId, run.runId),
        profileDir: join(this.dataRoot, RUN_WALK.profiles, run.workspaceId),
        sdkRoot: android?.sdkRoot ?? '',
        avd: android?.avd ?? '',
        idb: ios?.idb ?? '',
        udid: ios?.udid ?? '',
      });
    } finally {
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
      this.tools.attach({ workspaceId: run.workspaceId, driver });
      await this.watch({ workspaceId: run.workspaceId, driver });
    } catch (reason) {
      await driver?.close();
      this.drivers.delete(run.workspaceId);
      this.tools.detach(run.workspaceId);
      this.live.end(run.workspaceId);

      if (this.stopping.has(run.workspaceId)) {
        this.emit({ kind: 'done', workspaceId: run.workspaceId });

        return;
      }

      this.emit({
        kind: 'failed',
        workspaceId: run.workspaceId,
        failure: failureOf(reason),
      });

      return;
    }

    const broke = await this.walkSteps({ run, driver }).then(
      (failure) => failure,
      (reason: unknown) =>
        this.stopping.has(run.workspaceId) ? null : failureOf(reason),
    );

    await driver.close();
    this.drivers.delete(run.workspaceId);
    this.tools.detach(run.workspaceId);
    this.live.end(run.workspaceId);
    this.emit(
      broke === null
        ? { kind: 'done', workspaceId: run.workspaceId }
        : { kind: 'failed', workspaceId: run.workspaceId, failure: broke },
    );
  }

  /** Walks the cases in order, and ends once each case's agent said what it cost, or after a short wait. */
  private async walkSteps(props: {
    run: IWalkRun;
    driver: IDeviceDriver;
  }): Promise<RunFailure | null> {
    const { run, driver } = props;
    const costs: Promise<void>[] = [];
    const filed: string[] = [];

    try {
      for (const [position, steps] of casesOf(run.steps).entries()) {
        await this.holdWhilePaused(run.workspaceId);

        if (this.stopping.has(run.workspaceId)) break;

        if (position > 0) await driver.restart().catch(() => undefined);

        if (this.stopping.has(run.workspaceId)) break;

        const walked = await this.walkCase({ run, driver, steps, costs, filed });

        if (walked === false) break;

        if (walked !== true) return walked;
      }

      return null;
    } finally {
      await Promise.race([
        Promise.all(costs),
        new Promise((wake) => setTimeout(wake, RUN_WALK.costsWaitMs)),
      ]);
    }
  }

  /** One agent turn per case, in a session of its own: true goes on, false stops, a failure stops and says why. */
  private async walkCase(props: {
    run: IWalkRun;
    driver: IDeviceDriver;
    steps: { step: IFlatStep; index: number }[];
    costs: Promise<void>[];
    filed: string[];
  }): Promise<boolean | RunFailure> {
    const { run, driver } = props;
    const { workspaceId } = run;
    const pending = [...props.steps];
    let began = Date.now();
    let isOver = false;
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

      this.emit({
        kind: 'step',
        outcome: outcomeOfReport({
          report,
          step: walking.step,
          index: walking.index,
          workspaceId,
          tookMs: Date.now() - began,
          shot,
        }),
      });

      if (report.verdict === 'failed' && report.title.length > 0)
        props.filed.push(report.title);

      if (report.verdict !== 'passed') {
        unwalked('skipped');

        return endCase('Filed. The case stops here because this step did not hold up.');
      }

      const next = pending[0];

      if (next === undefined)
        return endCase('Filed. That was the last step of this case.');

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

      const shot = await driver.shoot(
        join(run.shotDir, `finding-${String(walking.index + 1)}-${String(findings)}.jpg`),
      );

      this.emit({
        kind: 'finding',
        workspaceId,
        finding: {
          ...finding,
          caseId: walking.step.caseId,
          stepNumber: walking.step.numberInCase,
          index: walking.index,
          action: walking.step.action,
          screenshot: shot?.dataUrl ?? null,
          shotFile: shot?.file ?? null,
        },
      });

      return `Filed as a bug. Carry on with step ${String(walking.step.numberInCase)}.`;
    };

    const mcpConfig = this.tools.mcpConfigFor(workspaceId);

    if (mcpConfig === null)
      throw new Error('The device tools are not up, so the agent cannot act.');

    const first = pending[0];

    if (first !== undefined)
      this.emit({ kind: 'doing', workspaceId, index: first.index });

    this.tools.attach({ workspaceId, driver, onReport, onFinding });

    const screen = await driver.describe().catch(() => '');

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
      mcpConfig,
      allowedTools: this.harness.toolsFor('runner').allowedTools,
      prompt: this.harness.walk({
        steps: pending.map(({ step }) => step),
        screen,
        language: run.language,
        filed: [...props.filed],
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

  private async watch(props: {
    workspaceId: string;
    driver: IDeviceDriver;
  }): Promise<void> {
    const { workspaceId, driver } = props;
    const isStreaming = await driver.stream((jpeg) => {
      this.live.push({ workspaceId, jpeg });
    });
    const url = this.live.urlFor(workspaceId);

    if (isStreaming && url !== null) this.emit({ kind: 'streaming', workspaceId, url });
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
