import type { IRunCoordinator, IStepResult, IWalkRun, IWalkStep } from './types';
import type { AgentRunner } from '@/main/classes/agents/AgentRunner';
import type { DeviceToolServer } from '@/main/classes/agents/DeviceToolServer';
import type { Harness } from '@/main/classes/agents/Harness';
import type { LiveStream } from '@/main/classes/devices/LiveStream';
import type { IDeviceDriver } from '@/main/classes/devices/types';
import type {
  IAndroidSetup,
  IIosSetup,
  IRunEvent,
  IStartRun,
  IStepOutcome,
  TargetKind,
} from '@/types';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { stripAnsi } from '@/main/library';
import { RUN_WALK } from './constants';
import {
  agentFailure,
  driverFor,
  parseNote,
  parseVerdict,
  skippedOutcome,
} from './library';

/** Walks a plan on a real device: the agent drives, the requirement judges. */
export class RunCoordinator {
  private readonly runner: AgentRunner;
  private readonly findCommand: (agentId: string) => Promise<string | null>;
  private readonly findAndroid: IRunCoordinator['findAndroid'];
  private readonly findIos: IRunCoordinator['findIos'];
  private readonly dataRoot: string;
  private readonly live: LiveStream;
  private readonly tools: DeviceToolServer;
  private readonly harness: Harness;
  private readonly onEvent: (event: IRunEvent) => void;
  private readonly stopping = new Set<string>();
  private readonly walking = new Set<string>();
  private readonly paused = new Set<string>();
  private readonly drivers = new Map<string, IDeviceDriver>();

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
  }

  public async start(run: IStartRun): Promise<void> {
    if (this.walking.has(run.workspaceId)) return;

    const command = await this.findCommand(run.agentId);

    if (!command) {
      this.onEvent({
        kind: 'failed',
        workspaceId: run.workspaceId,
        text: `gocrash cannot find ${run.agentId} on this machine. Install it, or pick another agent in Settings.`,
      });

      return;
    }

    const android = run.target.kind === 'android' ? await this.findAndroid() : null;
    const ios = run.target.kind === 'ios' ? await this.findIos() : null;
    const missing = this.whatIsMissing({ kind: run.target.kind, android, ios });

    if (missing !== null) {
      this.onEvent({ kind: 'failed', workspaceId: run.workspaceId, text: missing });

      return;
    }

    this.walking.add(run.workspaceId);

    try {
      await this.walk({
        ...run,
        command,
        shotDir: join(this.dataRoot, 'runs', run.workspaceId, run.runId),
        profileDir: join(this.dataRoot, RUN_WALK.profiles, run.workspaceId),
        sdkRoot: android?.sdkRoot ?? '',
        avd: android?.avd ?? '',
        idb: ios?.idb ?? '',
        udid: ios?.udid ?? '',
      });
    } finally {
      this.walking.delete(run.workspaceId);
      this.stopping.delete(run.workspaceId);
      this.paused.delete(run.workspaceId);
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
  }

  private whatIsMissing(props: {
    kind: TargetKind;
    android: IAndroidSetup | null;
    ios: IIosSetup | null;
  }): string | null {
    if (props.kind === 'android' && props.android === null)
      return 'gocrash found no Android emulator to open. Make one in Android Studio, then run the plan again.';

    if (props.kind === 'ios' && props.ios === null)
      return 'gocrash needs idb to tap an iOS simulator, and a simulator to open. Install idb with `brew install idb-companion`, then run the plan again.';

    return null;
  }

  private async walk(run: IWalkRun): Promise<void> {
    this.stopping.delete(run.workspaceId);

    let driver: IDeviceDriver | null = null;

    try {
      driver = driverFor(run);
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
        this.onEvent({ kind: 'done', workspaceId: run.workspaceId });

        return;
      }

      this.onEvent({
        kind: 'failed',
        workspaceId: run.workspaceId,
        text: this.explain(reason),
      });

      return;
    }

    const broke = await this.walkSteps({ run, driver }).then(
      () => null,
      (reason: unknown) =>
        this.stopping.has(run.workspaceId) ? null : this.explain(reason),
    );

    await driver.close();
    this.drivers.delete(run.workspaceId);
    this.tools.detach(run.workspaceId);
    this.live.end(run.workspaceId);
    this.onEvent(
      broke === null
        ? { kind: 'done', workspaceId: run.workspaceId }
        : { kind: 'failed', workspaceId: run.workspaceId, text: broke },
    );
  }

  private async walkSteps(props: {
    run: IWalkRun;
    driver: IDeviceDriver;
  }): Promise<void> {
    const { run, driver } = props;
    const broken = new Set<string>();
    let session: string | null = run.sessionId;
    let walkedCase = '';

    for (const [index, step] of run.steps.entries()) {
      await this.holdWhilePaused(run.workspaceId);

      if (this.stopping.has(run.workspaceId)) break;

      if (step.caseId !== walkedCase) {
        walkedCase = step.caseId;
        await this.reopen({ driver, url: run.target.value });
      }

      if (broken.has(step.caseId)) {
        this.onEvent({
          kind: 'step',
          outcome: skippedOutcome({ step, index, workspaceId: run.workspaceId }),
        });

        continue;
      }

      this.onEvent({ kind: 'doing', workspaceId: run.workspaceId, index });

      const result = await this.walkStep({ run, driver, step, index, session });

      if (result === null) break;

      session = result.session;

      if (result.verdict !== 'passed') broken.add(step.caseId);
    }
  }

  private async walkStep(props: IWalkStep): Promise<IStepResult | null> {
    const { run, driver, step, index } = props;
    const began = Date.now();
    const ask = {
      workspaceId: run.workspaceId,
      agentId: run.agentId,
      model: run.model,
      command: run.command,
    };

    const harness = this.harness.run(run.target);
    const mcpConfig = this.tools.mcpConfigFor(run.workspaceId);

    if (mcpConfig === null)
      throw new Error('The device tools are not up, so the agent cannot act.');

    // One call per step: the agent looks, acts and corrects itself through the tools, then judges.
    const asked = await this.runner.ask({
      ...ask,
      sessionId: props.session,
      schema: harness.schema,
      systemPrompt: harness.systemPrompt,
      mcpConfig,
      prompt: this.harness.step(step),
    });

    if (this.stopping.has(run.workspaceId)) return null;

    const failed = agentFailure(asked);

    if (failed !== null) throw new Error(failed);

    const verdict = parseVerdict(asked.text);
    const note = parseNote(asked.text);

    if (note.length > 0)
      this.onEvent({ kind: 'note', workspaceId: run.workspaceId, text: note });

    const shot = await driver.shoot(join(run.shotDir, `step-${String(index + 1)}.jpg`));

    const outcome: IStepOutcome = {
      workspaceId: run.workspaceId,
      caseId: step.caseId,
      stepNumber: step.numberInCase,
      index,
      action: step.action,
      expected: step.expected,
      verdict: verdict.verdict,
      why: verdict.why,
      got: verdict.got,
      title: verdict.title,
      severity: verdict.severity,
      tookMs: Date.now() - began,
      screenshot: shot?.dataUrl ?? null,
      shotFile: shot?.file ?? null,
    };

    this.onEvent({ kind: 'step', outcome });

    return { session: asked.sessionId, verdict: outcome.verdict };
  }

  private async reopen(props: { driver: IDeviceDriver; url: string }): Promise<void> {
    // Every case starts from the same place, or the one before it decides what this one sees.
    try {
      await props.driver.act({ kind: 'goto', target: props.url, value: '' });
    } catch {
      return;
    }
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

    if (isStreaming && url !== null)
      this.onEvent({ kind: 'streaming', workspaceId, url });
  }

  private async holdWhilePaused(workspaceId: string): Promise<void> {
    while (this.paused.has(workspaceId) && !this.stopping.has(workspaceId))
      await new Promise((wake) => setTimeout(wake, RUN_WALK.holdMs));
  }

  private explain(reason: unknown): string {
    return stripAnsi(reason instanceof Error ? reason.message : String(reason));
  }
}
