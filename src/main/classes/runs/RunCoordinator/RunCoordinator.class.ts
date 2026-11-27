import type {
  IAskQa,
  ICaseRecipe,
  IManualWalk,
  IOpenQuestion,
  IRecipeBook,
  IRunCoordinator,
  IRunDock,
  IRunTalk,
  IStepWatch,
  IVideoRecorder,
  IWalkRun,
  QaOutcome,
} from './types';
import type { AgentRunner } from '@/main/classes/agents/AgentRunner';
import type { LiveStream } from '@/main/classes/devices/LiveStream';
import type { IToolImage, IVariableValue, ShrinkImage } from '@/main/types';
import type {
  DeviceInput,
  IAndroidSetup,
  IDevelopedAsk,
  IDevelopedPlan,
  IFlatStep,
  IIosSetup,
  IManualMark,
  IRunEvent,
  KeepEvent,
  ManualPrep,
  IDesignShot,
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
  RunHow,
  TargetKind,
} from '@/shared/types';
import type {
  Harness,
  IAttachDevice,
  IDevicePort,
  IExploredScreen,
  ISaid,
  IExploreFinish,
  IQaQuestion,
  IStepFinding,
  IStepReport,
  McpHost,
} from '@ploomes/qazinho-harness';
import type { ISignInRecipe } from '@ploomes/qazinho-harness/contract';
import type { IDeviceDriver } from '@ploomes/qazinho-harness/engine';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { ARCHIVE } from '@/main/classes/storage/Archive/constants';
import { agentFailure, writeAtomically } from '@/main/library';
import { EXPLORATION } from '@/shared/constants';
import { mcpConfigWith } from '@ploomes/qazinho-harness';
import { SessionKeeper, WEB_DRIVER } from '@ploomes/qazinho-harness/engine';
import { EXPLORE_PUSHES, RUN_MANUAL, RUN_WALK, RUN_WATCH, UNWALKED } from './constants';
import {
  answerWords,
  askedAtOf,
  bookWith,
  bookWithPrep,
  casesOf,
  developsACase,
  driverFor,
  earlyFinish,
  expectedValuesOf,
  exploredOutcome,
  pageKeyOf,
  revealTarget,
  screenNameOf,
  failureOf,
  findingAnswer,
  followRunEvent,
  hiddenValues,
  keptBugId,
  markedBoxOf,
  markedOutcomeOf,
  maskedBody,
  outcomeOfReport,
  partialFor,
  partialRecipeOf,
  prepFor,
  prepStepOf,
  privateUrlOf,
  proofHolds,
  progressAside,
  proofWithValues,
  provableProof,
  readBook,
  recipeFor,
  recipeOf,
  recordedAction,
  replayedOutcome,
  signedInAsOf,
  stepCarryOn,
  talkAside,
  unwalkedOutcome,
  storedFilesOf,
  fileRefsIn,
  uploadPathOf,
  uploadRuleOf,
  variablePort,
  designFrameOf,
  withSignIn,
} from './library';

/** Anda um plano num dispositivo real: o agente dirige, o requisito julga. */
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
  private readonly dock: IRunDock | null;
  private readonly shrink: ShrinkImage | null;
  private readonly recorder: IVideoRecorder | null;
  private readonly variablesOf: (projectId: string) => Promise<IVariableValue[]>;
  private readonly attachmentsOf: NonNullable<IRunCoordinator['attachmentsOf']>;
  private readonly fetchFiles: NonNullable<IRunCoordinator['fetchFiles']> | null;
  private readonly keepVariable: NonNullable<IRunCoordinator['keepVariable']>;
  private readonly skillsOf: NonNullable<IRunCoordinator['skillsOf']>;
  private readonly askWaitMs: number;
  private readonly stopping = new Set<string>();
  private readonly walking = new Set<string>();
  private readonly paused = new Set<string>();
  private readonly drivers = new Map<string, IDeviceDriver>();
  private readonly inFlightRuns = new Map<string, IRunInFlight>();
  private readonly designShots = new Map<string, Map<string, IDesignShot>>();
  private readonly viewports = new Map<string, IViewport>();
  private readonly questions = new Map<string, IOpenQuestion>();
  private readonly talks = new Map<string, IRunTalk>();
  private readonly learnings = new Map<string, KeepEvent[]>();
  private readonly heardMemories = new Map<string, Set<string>>();
  private readonly addresses = new Map<string, { url: string; at: number }>();
  private readonly manualTurns = new Map<string, IManualWalk>();
  private readonly docked = new Set<string>();
  private readonly touches = new Map<string, Promise<void>>();
  private readonly framePumps = new Map<string, () => void>();

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
    this.dock = props.dock ?? null;
    this.shrink = props.shrink ?? null;
    this.recorder = props.recorder ?? null;
    this.variablesOf = props.variablesOf ?? (() => Promise.resolve([]));
    this.attachmentsOf = props.attachmentsOf ?? (() => Promise.resolve([]));
    this.fetchFiles = props.fetchFiles ?? null;
    this.keepVariable = props.keepVariable ?? (() => Promise.resolve(false));
    this.skillsOf = props.skillsOf ?? (() => Promise.resolve([]));
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
      address: null,
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
    this.learnings.set(run.workspaceId, []);
    this.heardMemories.set(run.workspaceId, new Set());
    this.designShots.set(run.workspaceId, new Map());

    const store = this.filesFolder(run.workspaceId);
    const uploadRefs = new Map<string, string>();

    await this.fetchMissingFiles({ run, store });

    const uploads = [
      ...(await storedFilesOf(store)),
      ...(await this.attachmentsOf(run.workspaceId).catch(() => [])),
    ];
    const planTexts = run.steps.flatMap((step) => [
      step.action,
      step.expected,
      step.caseGoal,
      step.casePreconditions,
    ]);

    try {
      await this.walk({
        ...run,
        uploads,
        uploadPath: uploadPathOf({
          canUpload: (file) =>
            uploadRuleOf({
              texts: [...planTexts, ...this.answersOf(run.workspaceId)],
              folders: [...new Set(uploads.map(({ path }) => dirname(path)))],
              home: homedir(),
              platform: process.platform,
            })(file),
          attachments: uploads,
          store,
          refs: uploadRefs,
        }),
        uploadRefs,
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
      this.endTalk(run.workspaceId);
      this.endLearning(run.workspaceId);
      this.walking.delete(run.workspaceId);
      this.inFlightRuns.delete(run.workspaceId);
      this.stopping.delete(run.workspaceId);
      this.paused.delete(run.workspaceId);
      this.viewports.delete(run.workspaceId);
      this.designShots.delete(run.workspaceId);
      this.docked.delete(run.workspaceId);
      this.dock?.end(run.workspaceId);
    }
  }

  public stop(workspaceId: string): void {
    this.paused.delete(workspaceId);

    if (!this.walking.has(workspaceId)) return;

    this.stopping.add(workspaceId);
    this.questions.get(workspaceId)?.settle({ kind: 'stopped' });
    this.manualTurns.get(workspaceId)?.end();
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

  /**
   * Entrega a resposta do QA à pergunta que o agente de uma run espera; uma resposta a
   * uma pergunta que não espera mais, ou sem nada nela, não muda nada.
   */
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

  /**
   * Guarda o que o QA disse no meio da run, para o agente ler ao agir de novo; sem run
   * andando não há quem ouça.
   */
  public talk(props: { workspaceId: string; text: string }): void {
    const { workspaceId } = props;
    const text = props.text.trim();

    if (!this.walking.has(workspaceId) || text.length === 0) return;

    const talk = this.talks.get(workspaceId);

    this.talks.set(workspaceId, {
      waiting: [...(talk?.waiting ?? []), text],
      isOpen: talk?.isOpen ?? false,
      refused: 0,
    });
  }

  /**
   * Redimensiona o dispositivo de uma run em andamento, para os casos que vêm também; a
   * próxima run começa no tamanho do workspace.
   */
  public async resize(props: {
    workspaceId: string;
    viewport: IViewport;
  }): Promise<void> {
    if (!this.walking.has(props.workspaceId)) return;

    this.viewports.set(props.workspaceId, props.viewport);
    await this.drivers.get(props.workspaceId)?.resize(props.viewport);
  }

  /** Os casos de um plano, como ele está agora, que já têm gravação para este alvo. */
  public async developed(ask: IDevelopedAsk): Promise<IDevelopedPlan> {
    const book = await this.readBook(ask.workspaceId);
    const caseIds = casesOf(ask.steps).flatMap((steps) => {
      const flat = steps.map(({ step }) => step);
      const caseId = flat[0]?.caseId;

      return caseId !== undefined &&
        recipeFor({ book, steps: flat, targetKind: ask.targetKind }) !== null
        ? [caseId]
        : [];
    });
    const store = this.filesFolder(ask.workspaceId);
    const files = await Promise.all(
      fileRefsIn(book.cases).map(async (ref) => ({
        name: basename(ref),
        size: (await stat(join(store, ref)).catch(() => null))?.size ?? 0,
      })),
    );

    return { caseIds, files };
  }

  /** Transmite o dispositivo de uma run em detalhe cheio enquanto o QA o vê de perto. */
  public async focus(props: { workspaceId: string; isFocused: boolean }): Promise<void> {
    await this.drivers.get(props.workspaceId)?.focus(props.isFocused);
  }

  /**
   * As runs ainda andando, como estão: uma página que abriu no meio de uma run as pega
   * daqui.
   */
  public inFlight(): IRunInFlight[] {
    return [...this.inFlightRuns.values()];
  }

  /** Um gesto do QA no dispositivo de um caso à mão, cada um depois do anterior. */
  public touch(props: { workspaceId: string; input: DeviceInput }): Promise<void> {
    const { workspaceId, input } = props;
    const turn = this.manualTurns.get(workspaceId);

    if (turn?.driver.touch === undefined) return Promise.resolve();

    const { driver } = turn;
    const queued = (this.touches.get(workspaceId) ?? Promise.resolve())
      .then(() => driver.touch?.(input))
      .catch(() => undefined);

    this.touches.set(workspaceId, queued);

    return queued;
  }

  /**
   * O QA marca o passo em que está num caso à mão: a tela de agora vira a evidência dele,
   * e o seguinte começa; depois do último, a vez do QA acaba.
   */
  public async mark(mark: IManualMark): Promise<void> {
    const { workspaceId } = mark;
    const turn = this.manualTurns.get(workspaceId);
    const walking = turn?.pending.shift();

    if (turn === undefined || walking === undefined) return;

    await (this.touches.get(workspaceId) ?? Promise.resolve());

    const shot = await turn.driver
      .shoot(join(turn.run.shotDir, `step-${String(walking.index + 1)}.jpg`))
      .catch(() => null);
    const at = Date.now();

    this.emit({
      kind: 'step',
      outcome: markedOutcomeOf({
        step: walking.step,
        index: walking.index,
        workspaceId,
        verdict: mark.verdict,
        note: hiddenValues({ text: mark.note.trim(), values: turn.run.values }),
        tookMs: at - turn.began,
        at,
        shot,
      }),
    });
    turn.began = at;

    const next = turn.pending[0];

    if (next === undefined) {
      turn.end();

      return;
    }

    this.emit({ kind: 'doing', workspaceId, index: next.index, how: 'manual' });
  }

  /** Digita no campo em foco o valor de uma variável, que nunca passa pela página. */
  public async typeVariable(props: {
    workspaceId: string;
    name: string;
  }): Promise<boolean> {
    const turn = this.manualTurns.get(props.workspaceId);
    const value = turn?.run.values.find(({ name }) => name === props.name)?.value;

    if (turn?.driver.touch === undefined || value === undefined) return false;

    await this.touch({
      workspaceId: props.workspaceId,
      input: { kind: 'type', text: value },
    });

    return true;
  }

  /** Termina o caso à mão: o que o QA não marcou fica sem marca, com o porquê. */
  public endManual(workspaceId: string): void {
    const turn = this.manualTurns.get(workspaceId);

    if (turn === undefined) return;

    const at = Date.now();

    for (const { step, index } of turn.pending.splice(0))
      this.emit({
        kind: 'step',
        outcome: unwalkedOutcome({
          step,
          index,
          workspaceId,
          verdict: 'skipped',
          why: UNWALKED.ended,
          reason: 'ended',
          at,
        }),
      });

    turn.end();
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

  /** Guarda o protótipo que o agente leu do Figma, para os bugs daquele frame. */
  private keepDesignShot(props: {
    workspaceId: string;
    shotDir: string;
    image: IToolImage;
  }): void {
    const { workspaceId, shotDir, image } = props;
    const frame = designFrameOf(image);

    if (frame === null) return;

    const kind = image.mediaType.split('/').at(-1) ?? 'png';
    const file = join(shotDir, `design-${frame.replace(/[^\w-]/g, '-')}.${kind}`);

    this.designShots
      .get(workspaceId)
      ?.set(frame, { src: `data:${image.mediaType};base64,${image.data}`, file });
    void mkdir(shotDir, { recursive: true })
      .then(() => writeFile(file, Buffer.from(image.data, 'base64')))
      .catch(() => undefined);
  }

  private designShotOf(props: {
    workspaceId: string;
    frame: string | undefined;
  }): IDesignShot | null {
    return props.frame === undefined
      ? null
      : (this.designShots.get(props.workspaceId)?.get(props.frame.replaceAll('-', ':')) ??
          null);
  }

  private async walk(run: IWalkRun): Promise<void> {
    this.stopping.delete(run.workspaceId);

    let driver: IDeviceDriver | null = null;

    try {
      const window =
        run.mode === 'manual'
          ? ((await this.dock?.start(run.workspaceId)) ?? null)
          : null;

      if (window !== null) this.docked.add(run.workspaceId);

      driver = driverFor({
        run,
        ...(this.shrink === null ? {} : { shrink: this.shrink }),
        ...(window === null
          ? {}
          : {
              window,
              onClosed: () => {
                this.closedByQa(run.workspaceId);
              },
            }),
        onAddress: (url) => {
          const shown = privateUrlOf({ url, values: run.values });

          this.addresses.set(run.workspaceId, { url: shown, at: Date.now() });
          this.emit({ kind: 'address', workspaceId: run.workspaceId, url: shown });
        },
        onScreens: (screens) => {
          this.emit({
            kind: 'screens',
            workspaceId: run.workspaceId,
            screens: screens.map((screen) => ({
              ...screen,
              url: privateUrlOf({ url: screen.url, values: run.values }),
              streamUrl: this.live.urlFor(run.workspaceId, screen.id),
            })),
          });
        },
      });
      this.drivers.set(run.workspaceId, driver);
      await mkdir(run.shotDir, { recursive: true });
      await driver.open();
      this.tools.attach({
        workspaceId: run.workspaceId,
        driver: this.portOf({ run, driver }),
      });
      await this.watch({ run, driver });
    } catch (reason) {
      const recorded = (await driver?.stopRecording().catch(() => null)) ?? null;

      await driver?.close();
      this.dock?.end(run.workspaceId);
      await this.keepNetwork({ run, driver });
      this.drivers.delete(run.workspaceId);
      this.addresses.delete(run.workspaceId);
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
        : run.mode === 'manual'
          ? this.walkManual({ run, driver })
          : this.walkSteps({ run, driver })
    ).then(
      (failure) => failure,
      (reason: unknown) =>
        this.stopping.has(run.workspaceId) ? null : failureOf(reason),
    );

    const recorded = await driver.stopRecording().catch(() => null);

    await driver.close();
    this.dock?.end(run.workspaceId);
    await this.keepNetwork({ run, driver });
    this.drivers.delete(run.workspaceId);
    this.addresses.delete(run.workspaceId);
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

  /**
   * Guarda os pedidos que um navegador viu ao lado do vídeo da run, cada endereço com os
   * segredos de fora; um celular não guarda nenhum.
   */
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
          ...(entry.body === undefined
            ? {}
            : {
                body: hiddenValues({
                  text: maskedBody(entry.body),
                  values: props.run.values,
                }),
              }),
        })),
      ),
      'utf8',
    ).catch(() => undefined);
  }

  /**
   * Diz como a run terminou, depois entrega a gravação dela: a do próprio celular, ou a
   * feita do stream vivo assim que o arquivo está inteiro.
   */
  private filesFolder(workspaceId: string): string {
    return join(this.dataRoot, ARCHIVE.workspaces, workspaceId, ARCHIVE.files);
  }

  private async fetchMissingFiles(props: {
    run: IStartRun;
    store: string;
  }): Promise<void> {
    const { run, store } = props;

    if (this.fetchFiles === null || run.projectId === undefined) return;

    const wanted = run.caseIds === undefined ? null : new Set(run.caseIds);
    const { cases } = await this.readBook(run.workspaceId);
    const refs = fileRefsIn(
      cases.filter(({ caseId }) => wanted === null || wanted.has(caseId)),
    );

    await this.fetchFiles({ projectId: run.projectId, refs, store }).catch(
      () => undefined,
    );
  }

  private answersOf(workspaceId: string): string[] {
    return (this.inFlightRuns.get(workspaceId)?.asked ?? []).flatMap(({ answer }) =>
      answer.kind === 'said' ? [answer.text] : [],
    );
  }

  private portOf(props: { run: IWalkRun; driver: IDeviceDriver }): IDevicePort {
    return variablePort({
      device: props.driver,
      values: props.run.values,
      uploadPath: props.run.uploadPath,
    });
  }

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

  /**
   * Anda os casos em ordem, e termina quando o agente de cada caso disse quanto custou,
   * ou depois de uma espera curta.
   */
  private async walkSteps(props: {
    run: IWalkRun;
    driver: IDeviceDriver;
  }): Promise<RunFailure | null> {
    const { run, driver } = props;
    const costs: Promise<void>[] = [];
    const filed: string[] = [];
    const book = await this.readBook(run.workspaceId);
    const recorded: ICaseRecipe[] = [];
    const partial: ICaseRecipe[] = [];
    let current: { step: IFlatStep; index: number } | undefined;
    const keeper =
      run.target.kind === 'web'
        ? new SessionKeeper({
            driver,
            port: this.portOf({ run, driver }),
            book,
            appUrl: run.target.value,
            signIn: (account) => this.signInTurn({ run, driver, account, at: current }),
            isStopped: () => this.stopping.has(run.workspaceId),
          })
        : null;

    try {
      const wanted = run.caseIds === undefined ? null : new Set(run.caseIds);
      const toWalk = casesOf(run.steps).filter(
        ([first]) =>
          first !== undefined &&
          first.step.caseIsManual !== true &&
          (wanted === null || wanted.has(first.step.caseId)),
      );

      for (const [position, steps] of toWalk.entries()) {
        await this.holdWhilePaused(run.workspaceId);

        if (this.stopping.has(run.workspaceId)) break;

        const flat = steps.map(({ step }) => step);
        const account = signedInAsOf({ steps: flat, targetKind: run.target.kind });

        current = steps[0];

        const isStarted = await this.startCase({
          driver,
          keeper,
          account,
          isFresh: position === 0,
        });

        if (this.stopping.has(run.workspaceId)) break;

        if (!isStarted) {
          this.leaveUnsigned({ run, steps, account });
          continue;
        }

        const recipe =
          run.mode === 'agent'
            ? null
            : recipeFor({ book, steps: flat, targetKind: run.target.kind });
        const begun =
          recipe !== null || run.mode === 'agent'
            ? null
            : partialFor({ book, steps: flat, targetKind: run.target.kind });
        const replayed =
          recipe !== null
            ? await this.replayCase({ run, driver, steps, recipe })
            : begun !== null
              ? await this.replayCase({
                  run,
                  driver,
                  steps: steps.slice(0, begun.steps.length),
                  recipe: begun,
                })
              : null;

        if (replayed === 'stopped') break;

        if (replayed === 'replayed' && begun === null) continue;

        if (
          replayed === 'diverged' &&
          !(await this.startCase({ driver, keeper, account, isFresh: false }))
        ) {
          if (this.stopping.has(run.workspaceId)) break;

          this.leaveUnsigned({ run, steps, account });
          continue;
        }

        if (this.stopping.has(run.workspaceId)) break;

        const from =
          replayed === 'replayed'
            ? (begun?.steps.length ?? 0)
            : typeof replayed === 'number'
              ? replayed
              : 0;
        const walked = await this.walkCase({
          run,
          driver,
          steps: steps.slice(from),
          caseSteps: flat,
          prior: replayed === 'replayed' ? begun : null,
          costs,
          filed,
          recorded,
          partial,
          isHealing: replayed === 'diverged' && begun === null,
          isUnderWay: typeof replayed === 'number' && from > 0,
          signedInAs: account,
          signInOf: () => (account === null ? null : (keeper?.signInOf(account) ?? null)),
        });

        if (recorded.length > 0 || partial.length > 0)
          await this.writeBook({
            workspaceId: run.workspaceId,
            book: bookWith({ book, recipes: recorded, partial }),
          }).catch(() => undefined);

        if (walked === false) break;

        if (walked !== true) return walked;
      }

      return null;
    } finally {
      if (recorded.length > 0 || partial.length > 0)
        await this.writeBook({
          workspaceId: run.workspaceId,
          book: bookWith({ book, recipes: recorded, partial }),
        }).catch(() => undefined);

      await Promise.race([
        Promise.all(costs),
        new Promise((wake) => setTimeout(wake, RUN_WALK.costsWaitMs)),
      ]);
    }
  }

  /**
   * Um caso à mão: o preparo, pela gravação dele ou pelo agente, e a vez do QA, que marca
   * cada passo até o último, até terminar o caso ou até parar a run.
   */
  private async walkManual(props: {
    run: IWalkRun;
    driver: IDeviceDriver;
  }): Promise<RunFailure | null> {
    const { run, driver } = props;
    const { workspaceId } = run;
    const wanted = run.caseIds === undefined ? null : new Set(run.caseIds);
    const steps = casesOf(run.steps).find(
      ([first]) =>
        first !== undefined && (wanted === null || wanted.has(first.step.caseId)),
    );
    const first = steps?.[0];

    if (steps === undefined || first === undefined) return null;

    if (!this.docked.has(workspaceId)) this.pumpFrames({ run, driver });

    try {
      const prep = await this.prepareManual({ run, driver, steps });

      if (this.stopping.has(workspaceId)) return null;

      const ended = new Promise<void>((end) => {
        this.manualTurns.set(workspaceId, {
          run,
          driver,
          pending: [...steps],
          began: Date.now(),
          end,
        });
      });

      this.emit({
        kind: 'manual',
        workspaceId,
        turn: { caseId: first.step.caseId, prep },
      });
      this.emit({ kind: 'doing', workspaceId, index: first.index, how: 'manual' });
      await ended;
      await (this.touches.get(workspaceId) ?? Promise.resolve());

      return null;
    } finally {
      this.manualTurns.delete(workspaceId);
      this.touches.delete(workspaceId);
      this.framePumps.get(workspaceId)?.();
      this.framePumps.delete(workspaceId);
    }
  }

  /**
   * Leva o app às pré-condições de um caso à mão: pela gravação do preparo enquanto ela
   * vale, senão pelo agente, que o grava; 'failed' deixa o preparo com o QA.
   */
  private async prepareManual(props: {
    run: IWalkRun;
    driver: IDeviceDriver;
    steps: { step: IFlatStep; index: number }[];
  }): Promise<ManualPrep> {
    const { run, driver, steps } = props;
    const { workspaceId } = run;
    const flat = steps.map(({ step }) => step);
    const prepStep = prepStepOf(flat);
    const first = steps[0];

    if (prepStep === null || first === undefined) return 'none';

    this.emit({ kind: 'doing', workspaceId, index: first.index, how: 'prepare' });

    const book = await this.readBook(workspaceId);
    const recipe = prepFor({ book, step: prepStep, targetKind: run.target.kind });

    if (recipe !== null) {
      if (await this.replayPrep({ run, driver, recipe })) return 'replayed';

      await driver.restart().catch(() => undefined);
    }

    if (this.stopping.has(workspaceId)) return 'failed';

    const prepared = await this.agentPrep({ run, driver, prepStep, steps: flat });

    if (prepared === null) return 'failed';

    await this.writeBook({
      workspaceId,
      book: bookWithPrep({ book: await this.readBook(workspaceId), prep: prepared }),
    }).catch(() => undefined);

    return 'agent';
  }

  private async replayPrep(props: {
    run: IWalkRun;
    driver: IDeviceDriver;
    recipe: ICaseRecipe;
  }): Promise<boolean> {
    const device = this.portOf({ run: props.run, driver: props.driver });
    const [kept] = props.recipe.steps;

    if (kept === undefined) return false;

    const isDone = await (async () => {
      for (const action of kept.actions) await device.act(action);
    })().then(
      () => true,
      () => false,
    );

    return isDone && (await this.proofShows({ device, proof: kept.proof }));
  }

  /**
   * O agente leva o app às pré-condições de um caso à mão num turno só, e o preparo vira
   * uma gravação quando ele o relata pronto, com a prova.
   */
  private async agentPrep(props: {
    run: IWalkRun;
    driver: IDeviceDriver;
    prepStep: IFlatStep;
    steps: IFlatStep[];
  }): Promise<ICaseRecipe | null> {
    const { run, driver, prepStep } = props;
    const { workspaceId } = run;
    const device = this.portOf({ run, driver });
    const actions: IStepAction[] = [];
    let prepared: ICaseRecipe | null = null;
    let over: () => void = () => undefined;
    const isOver = new Promise<null>((resolve) => {
      over = () => {
        resolve(null);
      };
    });
    const endTurn = (said: string) => {
      over();
      setImmediate(() => {
        this.tools.detach(workspaceId);
        this.runner.cancel(workspaceId);
      });

      return said;
    };
    const onReport = async (report: IStepReport): Promise<string> => {
      if (report.step !== 1)
        return 'Report step 1, the preparation: the steps of the case are the QA’s.';

      if (report.verdict !== 'passed')
        return endTurn('Noted: the QA prepares the case. End your turn now.');

      const screen = await device.describe().catch(() => '');

      prepared = recipeOf({
        steps: [prepStep],
        targetKind: run.target.kind,
        actions: new Map([[1, actions]]),
        proofs: new Map([
          [1, provableProof({ proof: report.proof, screen, values: run.values })],
        ]),
        runId: run.runId,
        at: Date.now(),
      });

      return endTurn('Prepared: the QA takes it from here. End your turn now.');
    };
    const mcpConfig = this.tools.mcpConfigFor(
      workspaceId,
      this.askWaitMs + RUN_WALK.toolMarginMs,
    );

    if (mcpConfig === null) return null;

    this.tools.attach({
      workspaceId,
      driver: {
        describe: () => device.describe(),
        inspect: (target) => device.inspect(target),
        failedCalls: () => device.failedCalls(),
        calls: (ask) => device.calls(ask),
        glance: () => device.glance(),
        act: async (action) => {
          await device.act(action);
          actions.push(
            recordedAction({
              appUrl: run.target.value,
              action:
                action.files === undefined
                  ? action
                  : {
                      ...action,
                      files: action.files.map((file) => run.uploadRefs.get(file) ?? file),
                    },
              found: driver.resolution?.() ?? null,
              values: run.values,
            }),
          );
        },
      },
      onReport,
      onFinding: () =>
        Promise.resolve('Not now: only prepare the case, the QA judges it.'),
      onAsk: () =>
        Promise.resolve(
          'Prepare it without the QA: report step 1 blocked if you cannot.',
        ),
      onSay: () => Promise.resolve('Noted.'),
    });

    const screen = await device.describe().catch(() => '');

    if (this.stopping.has(workspaceId)) {
      this.tools.detach(workspaceId);

      return null;
    }

    const asking = this.runner.ask({
      workspaceId,
      meter: { kind: 'prepare', workspaceId, projectId: run.projectId ?? null },
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
      prompt: this.harness.prepare({
        steps: props.steps,
        screen,
        language: run.language,
        variables: run.values.map(({ name, description }) => ({ name, description })),
        memories: run.memories ?? [],
      }),
    });

    void asking.then(
      ({ costUsd }) => {
        if (costUsd !== null) this.emit({ kind: 'cost', workspaceId, costUsd });
      },
      () => undefined,
    );
    await Promise.race([asking.catch(() => null), isOver]);
    this.tools.detach(workspaceId);

    return prepared;
  }

  /**
   * Abre o app para um caso: do zero, ou já dentro da conta em que ele começa numa run
   * web; false quando a run não conseguiu entrar nela.
   */
  private async startCase(props: {
    driver: IDeviceDriver;
    keeper: SessionKeeper | null;
    account: string | null;
    isFresh: boolean;
  }): Promise<boolean> {
    const { driver, keeper, account, isFresh } = props;

    if (account === null || keeper === null) {
      if (!isFresh) await driver.restart().catch(() => undefined);

      return true;
    }

    return keeper.start({ account, isFresh });
  }

  /** Deixa de fora um caso em cuja conta a run não entrou: o primeiro passo bloqueado. */
  private leaveUnsigned(props: {
    run: IWalkRun;
    steps: { step: IFlatStep; index: number }[];
    account: string | null;
  }): void {
    const at = Date.now();

    for (const [position, { step, index }] of props.steps.entries())
      this.emit({
        kind: 'step',
        outcome: unwalkedOutcome({
          step,
          index,
          workspaceId: props.run.workspaceId,
          verdict: position === 0 ? 'blocked' : 'skipped',
          why:
            position === 0
              ? `${UNWALKED.signIn} \${${props.account ?? ''}}`
              : UNWALKED.skipped,
          reason: position === 0 ? 'signIn' : 'skipped',
          at,
        }),
      });
  }

  /**
   * O agente entra numa conta num turno só, antes dos casos web que começam nela; o jeito
   * de entrar vira a gravação deles, e uma pergunta vai ao QA como em qualquer caso.
   */
  private async signInTurn(props: {
    run: IWalkRun;
    driver: IDeviceDriver;
    account: string;
    at: { step: IFlatStep; index: number } | undefined;
  }): Promise<ISignInRecipe | null> {
    const { run, driver, account, at } = props;
    const { workspaceId } = run;

    if (run.mode === 'replay' || this.stopping.has(workspaceId)) return null;

    const device = this.portOf({ run, driver });
    const actions: IStepAction[] = [];
    let signed: ISignInRecipe | null = null;
    let over: () => void = () => undefined;
    const isOver = new Promise<null>((resolve) => {
      over = () => {
        resolve(null);
      };
    });
    const endTurn = (said: string) => {
      over();
      setImmediate(() => {
        this.tools.detach(workspaceId);
        this.runner.cancel(workspaceId);
      });

      return said;
    };
    const onReport = async (report: IStepReport): Promise<string> => {
      if (report.verdict !== 'passed') return endTurn('Noted. End your turn now.');

      const screen = await device.describe().catch(() => '');
      const proof = provableProof({ proof: report.proof, screen, values: run.values });

      if (proof.trim().length > 0) signed = { account, actions, proof };

      return endTurn('Signed in: the cases take it from here. End your turn now.');
    };
    const onAsk = async (question: IQaQuestion): Promise<string> => {
      if (at === undefined)
        return 'Sign in without the QA: report step 1 blocked if you cannot.';

      const { words } = await this.askQa({
        run,
        asked: question,
        at: { caseId: at.step.caseId, stepNumber: 1, action: at.step.action },
        carryOn: 'Carry on signing in.',
        noAnswer:
          'Sign in without it if you can, or report step 1 blocked and say what you needed.',
      });

      return words;
    };
    const mcpConfig = this.tools.mcpConfigFor(
      workspaceId,
      this.askWaitMs + RUN_WALK.toolMarginMs,
    );

    if (mcpConfig === null) return null;

    if (at !== undefined)
      this.emit({ kind: 'doing', workspaceId, index: at.index, how: 'signIn' });

    this.tools.attach({
      workspaceId,
      driver: {
        describe: () => device.describe(),
        inspect: (target) => device.inspect(target),
        failedCalls: () => device.failedCalls(),
        calls: (ask) => device.calls(ask),
        glance: () => device.glance(),
        act: async (action) => {
          await device.act(action);
          actions.push(
            recordedAction({
              appUrl: run.target.value,
              action,
              found: driver.resolution?.() ?? null,
              values: run.values,
            }),
          );
        },
      },
      onReport,
      onFinding: () => Promise.resolve('Not now: only sign in.'),
      onAsk,
      onSay: () => Promise.resolve('Noted.'),
    });

    const screen = await device.describe().catch(() => '');

    if (this.stopping.has(workspaceId)) {
      this.tools.detach(workspaceId);

      return null;
    }

    const asking = this.runner.ask({
      workspaceId,
      meter: { kind: 'sign-in', workspaceId, projectId: run.projectId ?? null },
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
      prompt: this.harness.signIn({
        account,
        screen,
        language: run.language,
        variables: run.values.map(({ name, description }) => ({ name, description })),
        memories: run.memories ?? [],
      }),
    });

    void asking.then(
      ({ costUsd }) => {
        if (costUsd !== null) this.emit({ kind: 'cost', workspaceId, costUsd });
      },
      () => undefined,
    );
    await Promise.race([asking.catch(() => null), isOver]);
    this.tools.detach(workspaceId);

    return signed;
  }

  /**
   * Manda ao stream a tela de um celular, que não transmite sozinho, enquanto o QA anda
   * um caso à mão nele.
   */
  private pumpFrames(props: { run: IWalkRun; driver: IDeviceDriver }): void {
    const { run, driver } = props;
    const { workspaceId } = run;
    const url = this.live.urlFor(workspaceId);
    const snapshot = driver.snapshot?.bind(driver);

    if (snapshot === undefined || url === null) return;

    let isOn = true;
    const pump = async () => {
      while (isOn && !this.stopping.has(workspaceId)) {
        const frame = await snapshot().catch(() => null);

        if (frame !== null && isOn)
          this.live.push({ workspaceId, jpeg: frame.jpeg, ratio: frame.ratio });

        await new Promise((wake) => setTimeout(wake, RUN_MANUAL.frameMs));
      }
    };

    this.framePumps.set(workspaceId, () => {
      isOn = false;
    });
    this.emit({ kind: 'streaming', workspaceId, url });
    void pump();
  }

  /**
   * Um turno de agente por caso, guardado como receita quando ele andou o caso inteiro e
   * todo passo passou com a prova: true segue, false para, uma falha diz por quê.
   */
  private async walkCase(props: {
    run: IWalkRun;
    driver: IDeviceDriver;
    steps: { step: IFlatStep; index: number }[];
    caseSteps: IFlatStep[];
    prior: ICaseRecipe | null;
    costs: Promise<void>[];
    filed: string[];
    recorded: ICaseRecipe[];
    partial: ICaseRecipe[];
    isHealing: boolean;
    isUnderWay: boolean;
    signedInAs: string | null;
    signInOf: () => ISignInRecipe | null;
  }): Promise<boolean | RunFailure> {
    const { run, driver } = props;
    const { workspaceId } = run;
    const how: RunHow = props.isHealing || props.isUnderWay ? 'adjust' : 'develop';
    const pending = [...props.steps];
    let watch: IStepWatch = { actions: 0, sinceSay: 0, askedAt: 0 };
    let watchedFrom = Date.now();
    const actions = new Map<number, IStepAction[]>(
      props.prior?.steps.map(({ number, actions: kept }) => [number, kept]) ?? [],
    );
    const proofs = new Map<number, string>(
      props.prior?.steps.map(({ number, proof }) => [number, proof]) ?? [],
    );
    const device = this.portOf({ run, driver });
    let began = Date.now();
    let hasFailed = false;
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
            reason: position === 0 && verdict === 'blocked' ? 'unreported' : 'skipped',
            at,
          }),
        });

      pending.length = 0;
    };

    const onReport = async (report: IStepReport): Promise<string> => {
      const walking = pending[0];

      if (walking === undefined)
        return 'Every step of this case is reported. End your turn now.';

      const held = this.talkHolds(run);

      if (held !== null) return `${held} Then report step ${String(report.step)} again.`;

      if (report.step !== walking.step.numberInCase)
        return `Step ${String(walking.step.numberInCase)} is not reported yet: carry it out and report it first.`;

      pending.shift();
      watch = { actions: 0, sinceSay: 0, askedAt: 0 };
      watchedFrom = Date.now();

      if (report.note.length > 0)
        this.emit({ kind: 'note', workspaceId, text: report.note });

      if (report.verdict === 'failed')
        await revealTarget({
          driver,
          ...(report.target === undefined ? {} : { target: report.target }),
          ...(report.category === undefined ? {} : { category: report.category }),
        });

      const shot = await driver.shoot(
        join(run.shotDir, `step-${String(walking.index + 1)}.jpg`),
      );
      const box =
        report.verdict === 'failed'
          ? await markedBoxOf({
              driver,
              ...(report.target === undefined ? {} : { target: report.target }),
              ...(report.category === undefined ? {} : { category: report.category }),
            })
          : null;
      const at = Date.now();

      const kept =
        report.verdict === 'failed'
          ? keptBugId({ asked: report.sameAs, known: run.bugs ?? [] })
          : null;
      const reported = outcomeOfReport({
        report: { ...report, sameAs: kept ?? undefined },
        step: walking.step,
        index: walking.index,
        workspaceId,
        tookMs: at - began,
        at,
        shot,
        box,
      });
      const designShot = this.designShotOf({ workspaceId, frame: reported.frame });
      const outcome = designShot === null ? reported : { ...reported, designShot };

      this.emit({
        kind: 'step',
        outcome: props.isHealing ? { ...outcome, by: 'healed' } : outcome,
      });

      if (report.verdict === 'passed') {
        const screen = await device.describe().catch(() => '');

        proofs.set(
          walking.step.numberInCase,
          provableProof({
            proof: proofWithValues({
              proof: report.proof,
              values: expectedValuesOf(walking.step.expected),
              screen,
            }),
            screen,
            values: run.values,
          }),
        );
      }

      if (report.verdict === 'failed' && report.title.length > 0)
        props.filed.push(report.title);

      if (report.verdict !== 'passed') hasFailed = true;

      if (
        report.verdict === 'blocked' ||
        (report.verdict === 'failed' && !report.goesOn)
      ) {
        unwalked('skipped');

        return endCase('Filed. The case stops here because this step did not hold up.');
      }

      const next = pending[0];

      if (next === undefined && hasFailed)
        return endCase('Filed. That was the last step of this case.');

      if (next === undefined) {
        const recipe = recipeOf({
          steps: props.caseSteps,
          targetKind: run.target.kind,
          actions,
          proofs,
          runId: run.runId,
          at,
        });

        if (recipe !== null && !isAnsweredForThisRun && !props.isUnderWay) {
          props.recorded.push(withSignIn({ recipe, signIn: props.signInOf() }));
          this.emit({ kind: 'recorded', workspaceId, caseId: walking.step.caseId });
        }

        return endCase('Filed. That was the last step of this case.');
      }

      await this.holdWhilePaused(workspaceId);

      if (this.stopping.has(workspaceId))
        return 'The QA stopped the run: end your turn now.';

      began = Date.now();
      this.emit({ kind: 'doing', workspaceId, index: next.index, how });

      return report.verdict === 'failed'
        ? `Filed as a bug. The action went through, so the case goes on. Next is step ${String(next.step.numberInCase)}: ${next.step.action}`
        : `Filed. Next is step ${String(next.step.numberInCase)}: ${next.step.action}`;
    };

    let findings = 0;

    const onFinding = async (finding: IStepFinding): Promise<string> => {
      const walking = pending[0];

      if (walking === undefined || isOver) return 'This case is over: end your turn now.';

      findings += 1;
      props.filed.push(finding.title);

      const kept = keptBugId({ asked: finding.sameAs, known: run.bugs ?? [] });

      await revealTarget({
        driver,
        ...(finding.target === undefined ? {} : { target: finding.target }),
        ...(finding.category === undefined ? {} : { category: finding.category }),
      });

      const shot = await driver.shoot(
        join(run.shotDir, `finding-${String(walking.index + 1)}-${String(findings)}.jpg`),
      );
      const box = await markedBoxOf({
        driver,
        ...(finding.target === undefined ? {} : { target: finding.target }),
        ...(finding.category === undefined ? {} : { category: finding.category }),
      });

      const designShot = this.designShotOf({ workspaceId, frame: finding.frame });

      this.emit({
        kind: 'finding',
        workspaceId,
        finding: {
          ...finding,
          ...(designShot === null ? {} : { designShot }),
          sameAs: kept ?? undefined,
          caseId: walking.step.caseId,
          stepNumber: walking.step.numberInCase,
          index: walking.index,
          action: walking.step.action,
          at: Date.now(),
          screenshot: shot?.dataUrl ?? null,
          shotFile: shot?.file ?? null,
          ...(box === null ? {} : { box }),
        },
      });

      return findingAnswer({
        asked: finding.sameAs,
        kept,
        carryOn: stepCarryOn(walking.step.numberInCase),
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

      watch = { ...watch, sinceSay: 0, askedAt: watch.actions };
      watchedFrom = Date.now();

      return isOver ? 'This case is over: end your turn now.' : words;
    };

    const onSay = (said: ISaid): Promise<string> => {
      watch = { ...watch, sinceSay: 0 };

      return Promise.resolve(this.tellQa({ run, said }));
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
      this.emit({ kind: 'doing', workspaceId, index: first.index, how });

    const port: IDevicePort = {
      describe: () => device.describe(),
      inspect: (target) => device.inspect(target),
      failedCalls: () => device.failedCalls(),
      calls: (ask) => device.calls(ask),
      glance: () => device.glance(),
      act: async (action) => {
        await device.act(action);

        const walking = pending[0];

        watch = {
          ...watch,
          actions: watch.actions + 1,
          sinceSay: watch.sinceSay + 1,
        };

        if (walking !== undefined)
          actions.set(walking.step.numberInCase, [
            ...(actions.get(walking.step.numberInCase) ?? []),
            recordedAction({
              appUrl: run.target.value,
              action:
                action.files === undefined
                  ? action
                  : {
                      ...action,
                      files: action.files.map((file) => run.uploadRefs.get(file) ?? file),
                    },
              found: driver.resolution?.() ?? null,
              values: run.values,
            }),
          ]);
      },
    };

    const aside = (): string | null => {
      const told = this.heard(run);

      if (told !== null) return told;

      const walking = pending[0];

      if (walking === undefined || isOver) return null;

      const progress = progressAside({
        watch,
        stepNumber: walking.step.numberInCase,
        tookMs: Date.now() - watchedFrom,
      });

      watch = progress.watch;

      return progress.text;
    };

    this.tools.attach({
      workspaceId,
      driver: port,
      onReport,
      onFinding,
      onAsk,
      onSay,
      onAnswer: (text) => Promise.resolve(this.answered({ workspaceId, text })),
      aside,
    });

    const screen = await device.describe().catch(() => '');

    if (this.stopping.has(workspaceId)) return false;

    const asking = this.runner.ask({
      workspaceId,
      meter: { kind: 'case', workspaceId, projectId: run.projectId ?? null },
      agentId: run.agentId,
      command: run.command,
      model: run.model,
      sessionId: null,
      systemPrompt: this.harness.run({
        target: run.target,
        viewport: this.viewports.get(workspaceId) ?? run.viewport ?? WEB_DRIVER.viewport,
        language: run.language,
      }),
      onToolImage: (image) => {
        this.keepDesignShot({ workspaceId, shotDir: run.shotDir, image });
      },
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
        told: (this.inFlightRuns.get(workspaceId)?.asked ?? []).flatMap(
          ({ question, answer }) =>
            answer.kind === 'said' ? [{ question, answer: answer.text }] : [],
        ),
        isUnderWay: props.isUnderWay || props.prior !== null,
        memories: run.memories ?? [],
        heardMemories: [...(this.heardMemories.get(workspaceId) ?? [])],
        uploads: run.uploads,
        signedInAs: props.signedInAs,
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
    const stoppedAt =
      isAnsweredForThisRun || props.isUnderWay
        ? null
        : partialRecipeOf({
            steps: props.caseSteps,
            targetKind: run.target.kind,
            actions,
            proofs,
            runId: run.runId,
            at: Date.now(),
          });

    if (stoppedAt !== null)
      props.partial.push(withSignIn({ recipe: stoppedAt, signIn: props.signInOf() }));

    if (this.stopping.has(workspaceId)) return false;

    if (isOver || asked === null) return true;

    const failed = agentFailure(asked);

    if (failed !== null) return failed;

    unwalked('blocked');

    return true;
  }

  /**
   * Explora o app sem plano, um agente sozinho até terminar ou o tempo dele acabar: cada
   * tela que anota é um passo de um caso só, e cada bug que registra um achado.
   */
  private async explore(props: {
    run: IWalkRun;
    driver: IDeviceDriver;
  }): Promise<RunFailure | null> {
    const { run, driver } = props;
    const { workspaceId } = run;
    const minutes = run.minutes ?? EXPLORATION.minutes;
    let endsAt = Date.now() + minutes * 60_000;
    let late: NodeJS.Timeout | undefined;
    const device = this.portOf({ run, driver });
    let screens = 0;
    let findings = 0;
    let current = { number: 0, name: '' };
    let notedPage: string | null = null;
    let last = Date.now();
    let isOver = false;
    let pushes = 0;
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

    const note = async (noted: { screen: IExploredScreen; at?: number }) => {
      screens += 1;

      const number = screens;
      const shot = await driver.shoot(join(run.shotDir, `screen-${String(number)}.jpg`));
      const at = Math.max(last, noted.at ?? Date.now());
      const here = this.addresses.get(workspaceId);

      current = { number, name: noted.screen.name };
      notedPage = here === undefined ? null : pageKeyOf(here.url);
      this.emit({
        kind: 'step',
        outcome: exploredOutcome({
          workspaceId,
          screen: noted.screen,
          number,
          tookMs: at - last,
          at,
          shot,
        }),
      });
      last = at;

      return number;
    };

    const onScreen = async (screen: IExploredScreen): Promise<string> => {
      if (isOver) return 'The exploration is over: end your turn now.';

      const number = await note({ screen });

      return `Noted screen ${String(number)}: ${screen.name}. Carry on exploring.`;
    };

    const onFinding = async (finding: IStepFinding): Promise<string> => {
      if (isOver) return 'The exploration is over: end your turn now.';

      const here = this.addresses.get(workspaceId);

      if (here !== undefined && pageKeyOf(here.url) !== notedPage)
        await note({ screen: { name: screenNameOf(here.url), about: '' }, at: here.at });

      findings += 1;

      const kept = keptBugId({ asked: finding.sameAs, known: run.bugs ?? [] });

      await revealTarget({
        driver,
        ...(finding.target === undefined ? {} : { target: finding.target }),
        ...(finding.category === undefined ? {} : { category: finding.category }),
      });

      const shot = await driver.shoot(
        join(run.shotDir, `finding-explore-${String(findings)}.jpg`),
      );
      const box = await markedBoxOf({
        driver,
        ...(finding.target === undefined ? {} : { target: finding.target }),
        ...(finding.category === undefined ? {} : { category: finding.category }),
      });

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
          ...(box === null ? {} : { box }),
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

      const held = this.talkHolds(run);

      if (held !== null) return Promise.resolve(`${held} Then call finish again.`);

      const early =
        pushes >= EXPLORE_PUSHES
          ? null
          : earlyFinish({ leftMs: endsAt - Date.now(), totalMs: minutes * 60_000 });

      if (early !== null) {
        pushes += 1;

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
        at: askedAtOf({
          at: {
            caseId: EXPLORATION.caseId,
            stepNumber: current.number,
            action: current.name,
          },
          screen: question.screen,
          isExploring: true,
        }),
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

    const design = this.harness.designAccess(run.design ?? null);
    const attached: IAttachDevice = {
      workspaceId,
      driver: device,
      purpose: 'explore',
      endsAt,
      onScreen,
      onFinding,
      onFinish,
      onAsk,
      onSay: (said) => Promise.resolve(this.tellQa({ run, said })),
      onAnswer: (text) => Promise.resolve(this.answered({ workspaceId, text })),
      aside: () => this.heard(run),
    };

    this.tools.attach(attached);

    const screen = await device.describe().catch(() => '');
    const skills =
      run.projectId === undefined
        ? []
        : await this.skillsOf(run.projectId).catch(() => []);

    if (this.stopping.has(workspaceId)) return null;

    const asking = this.runner.ask({
      workspaceId,
      meter: { kind: 'explore', workspaceId, projectId: run.projectId ?? null },
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
      onToolImage: (image) => {
        this.keepDesignShot({ workspaceId, shotDir: run.shotDir, image });
      },
      mcpConfig:
        mcpConfigWith({ config: mcpConfig, servers: design.servers }) ?? mcpConfig,
      allowedTools: [
        ...this.harness.toolsFor('explorer').allowedTools,
        ...design.allowedTools,
      ],
      prompt: this.harness.startExploring({
        minutes,
        screen,
        variables: run.values.map(({ name, description }) => ({ name, description })),
        known: run.bugs ?? [],
        design: run.design ?? null,
        plan: run.plan ?? [],
        memories: run.memories ?? [],
        skills,
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
    const isRecorded =
      run.mode === 'manual' ||
      !developsACase({ run, book: await this.readBook(workspaceId) });
    const isStreaming = await driver.stream((jpeg, screen) => {
      const viewport =
        this.viewports.get(workspaceId) ?? run.viewport ?? WEB_DRIVER.viewport;

      this.live.push({
        workspaceId,
        ...(screen === undefined ? {} : { screen }),
        jpeg,
        ratio: viewport.width / viewport.height,
      });
    });
    const url = this.live.urlFor(workspaceId);

    if (!isStreaming || url === null) {
      if (isRecorded) await driver.record(run.shotDir).catch(() => false);

      return;
    }

    this.emit({ kind: 'streaming', workspaceId, url });

    if (isRecorded)
      await this.recorder
        ?.start({ workspaceId, runId: run.runId, url })
        .catch(() => undefined);
  }

  /**
   * Anda um caso sem o agente, conferindo a prova de cada passo; quando o QA fala, para
   * ali e devolve o passo em que o agente assume, de onde o app está.
   */
  private async replayCase(props: {
    run: IWalkRun;
    driver: IDeviceDriver;
    steps: { step: IFlatStep; index: number }[];
    recipe: ICaseRecipe;
  }): Promise<'replayed' | 'diverged' | 'stopped' | number> {
    const { run, driver, recipe } = props;
    const { workspaceId } = run;
    const outcomes: IStepOutcome[] = [];
    const device = this.portOf({ run, driver });

    for (const [position, { step, index }] of props.steps.entries()) {
      await this.holdWhilePaused(workspaceId);

      if (this.stopping.has(workspaceId)) return 'stopped';

      if (this.hasTalkWaiting(workspaceId)) {
        for (const outcome of outcomes) this.emit({ kind: 'step', outcome });

        return position;
      }

      const kept = recipe.steps.find(({ number }) => number === step.numberInCase);

      if (kept === undefined) return 'diverged';

      this.emit({ kind: 'doing', workspaceId, index, how: 'replay' });

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

    await writeAtomically({ file, data: JSON.stringify(props.book, null, 2) });
  }

  /**
   * Mostra ao QA o que o agente perguntou e espera, com o relógio do agente parado, uma
   * resposta, um timeout ou um stop.
   */
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

    if (answer.kind === 'said')
      this.learnings
        .get(workspaceId)
        ?.push({ kind: 'answered', question: question.question, answer: answer.text });

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

  /**
   * A resposta do QA como a run a guarda: as palavras dele com valores lidos de volta
   * como nomes, ou um segredo.
   */
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
    while (
      this.paused.has(workspaceId) &&
      !this.stopping.has(workspaceId) &&
      !this.hasTalkWaiting(workspaceId)
    )
      await new Promise((wake) => setTimeout(wake, RUN_WALK.holdMs));
  }

  private hasTalkWaiting(workspaceId: string): boolean {
    return (this.talks.get(workspaceId)?.waiting.length ?? 0) > 0;
  }

  /** Entrega ao agente o que o QA disse e ele não leu, cada variável lida como o nome. */
  private heard(run: IWalkRun): string | null {
    const { workspaceId } = run;
    const talk = this.talks.get(workspaceId);

    if (talk === undefined || talk.waiting.length === 0) return null;

    this.talks.set(workspaceId, { waiting: [], isOpen: true, refused: 0 });
    this.emit({ kind: 'heard', workspaceId });

    const heard = talk.waiting.map((text) => hiddenValues({ text, values: run.values }));

    this.learnings
      .get(workspaceId)
      ?.push(...heard.map((text) => ({ kind: 'said' as const, text })));

    return talkAside(heard);
  }

  /**
   * Mostra ao QA o que o agente diz, cada memória uma vez só em toda a run, e guarda para
   * pesar depois o que ele disse andando, cada variável lida como o nome dela.
   */
  private tellQa(props: { run: IWalkRun; said: ISaid }): string {
    const { run } = props;
    const { text, memory } = props.said;
    const heard = this.heardMemories.get(run.workspaceId);
    const isKnown = (run.memories ?? []).some(({ id }) => id === memory);

    if (memory === undefined)
      this.learnings
        .get(run.workspaceId)
        ?.push({ kind: 'walked', text: hiddenValues({ text, values: run.values }) });

    if (memory !== undefined && isKnown && heard?.has(memory) === true)
      return 'The QA already heard that one. Carry on.';

    if (memory !== undefined && isKnown) heard?.add(memory);

    this.emit({ kind: 'note', workspaceId: run.workspaceId, text });

    return 'The QA read it. Carry on.';
  }

  /** Entrega à página o que a run aprendeu, para ela pesar o que guardar. */
  private endLearning(workspaceId: string): void {
    const events = this.learnings.get(workspaceId) ?? [];

    this.learnings.delete(workspaceId);
    this.heardMemories.delete(workspaceId);

    if (events.length > 0) this.emit({ kind: 'learnings', workspaceId, events });
  }

  /**
   * O que segura um passo enquanto o QA espera: o que ele disse e o agente ainda não leu,
   * ou a resposta que o agente não deu, algumas vezes antes de deixar a run seguir.
   */
  private talkHolds(run: IWalkRun): string | null {
    const { workspaceId } = run;
    const told = this.heard(run);

    if (told !== null) return told;

    const talk = this.talks.get(workspaceId);

    if (talk?.isOpen !== true) return null;

    if (talk.refused >= RUN_WATCH.talkRefusals) {
      this.talks.set(workspaceId, { ...talk, isOpen: false, refused: 0 });
      this.emit({ kind: 'replied', workspaceId, text: null });

      return null;
    }

    this.talks.set(workspaceId, { ...talk, refused: talk.refused + 1 });

    return 'The QA is waiting for your answer: check what they told you and call answer_qa first.';
  }

  private answered(props: { workspaceId: string; text: string }): string {
    const { workspaceId, text } = props;
    const talk = this.talks.get(workspaceId);

    if (talk?.isOpen !== true) return 'The QA asked you nothing right now. Carry on.';

    this.talks.set(workspaceId, { ...talk, isOpen: false, refused: 0 });
    this.emit({ kind: 'replied', workspaceId, text });

    return 'The QA read your answer. Carry on with the plan.';
  }

  /** Solta o que o QA disse e nenhum agente chegou a ler, para o chat responder. */
  private endTalk(workspaceId: string): void {
    const talk = this.talks.get(workspaceId);

    this.talks.delete(workspaceId);

    if (talk !== undefined && talk.waiting.length > 0)
      this.emit({ kind: 'unheard', workspaceId, texts: talk.waiting });
  }

  private closedByQa(workspaceId: string): void {
    if (this.manualTurns.has(workspaceId)) this.endManual(workspaceId);
    else this.stop(workspaceId);
  }

  private emit(event: IRunEvent): void {
    const workspaceId =
      event.kind === 'step' ? event.outcome.workspaceId : event.workspaceId;
    const run = this.inFlightRuns.get(workspaceId);

    if (run) this.inFlightRuns.set(workspaceId, followRunEvent({ run, event }));

    this.onEvent(event);
  }
}
