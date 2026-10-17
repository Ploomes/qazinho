import type { IRunCoordinator, IWalkRun } from './types';
import type { AgentRunner } from '@/main/classes/agents/AgentRunner';
import type { DeviceToolServer } from '@/main/classes/agents/DeviceToolServer';
import type { IStepReport } from '@/main/classes/agents/DeviceToolServer/types';
import type { Harness } from '@/main/classes/agents/Harness';
import type { LiveStream } from '@/main/classes/devices/LiveStream';
import type { IDeviceDriver } from '@/main/classes/devices/types';
import type {
  IAndroidSetup,
  IFlatStep,
  IIosSetup,
  IRunEvent,
  IStartRun,
  TargetKind,
} from '@/shared/types';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { stripAnsi } from '@/main/library';
import { RUN_WALK, UNWALKED } from './constants';
import {
  agentFailure,
  casesOf,
  driverFor,
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
        text: `QAzinho cannot find ${run.agentId} on this machine. Install it, or pick another agent in Settings.`,
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
      return 'QAzinho found no Android emulator to open. Make one in Android Studio, then run the plan again.';

    if (props.kind === 'ios' && props.ios === null)
      return 'QAzinho needs idb to tap an iOS simulator, and a simulator to open. Install idb with `brew install idb-companion`, then run the plan again.';

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

    for (const steps of casesOf(run.steps)) {
      await this.holdWhilePaused(run.workspaceId);

      if (this.stopping.has(run.workspaceId)) break;

      await this.reopen({ driver, url: run.target.value });

      if (!(await this.walkCase({ run, driver, steps }))) break;
    }
  }

  /** One agent turn per case, in a session of its own: it acts and reports each step through the tools. */
  private async walkCase(props: {
    run: IWalkRun;
    driver: IDeviceDriver;
    steps: { step: IFlatStep; index: number }[];
  }): Promise<boolean> {
    const { run, driver } = props;
    const { workspaceId } = run;
    const pending = [...props.steps];
    let began = Date.now();
    let isOver = false;

    const endCase = (said: string) => {
      isOver = true;
      setImmediate(() => {
        this.runner.cancel(workspaceId);
      });

      return said;
    };

    const unwalked = (verdict: 'skipped' | 'blocked') => {
      for (const [position, { step, index }] of pending.entries())
        this.onEvent({
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
        this.onEvent({ kind: 'note', workspaceId, text: report.note });

      const shot = await driver.shoot(
        join(run.shotDir, `step-${String(walking.index + 1)}.jpg`),
      );

      this.onEvent({
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
      this.onEvent({ kind: 'doing', workspaceId, index: next.index });

      return `Filed. Next is step ${String(next.step.numberInCase)}: ${next.step.action}`;
    };

    const mcpConfig = this.tools.mcpConfigFor(workspaceId);

    if (mcpConfig === null)
      throw new Error('The device tools are not up, so the agent cannot act.');

    const first = pending[0];

    if (first !== undefined)
      this.onEvent({ kind: 'doing', workspaceId, index: first.index });

    this.tools.attach({ workspaceId, driver, onReport });

    const asked = await this.runner.ask({
      workspaceId,
      command: run.command,
      model: run.model,
      sessionId: null,
      systemPrompt: this.harness.run(run.target),
      mcpConfig,
      prompt: this.harness.walk({
        steps: pending.map(({ step }) => step),
        screen: await driver.describe().catch(() => ''),
      }),
    });

    if (this.stopping.has(workspaceId)) return false;

    if (isOver) return true;

    const failed = agentFailure(asked);

    if (failed !== null) throw new Error(failed);

    unwalked('blocked');

    return true;
  }

  private async reopen(props: { driver: IDeviceDriver; url: string }): Promise<void> {
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
