import type { IRunCoordinator, IStepResult, IWalkRun, IWalkStep } from './types';
import type { AgentRunner } from '@/main/classes/agents/AgentRunner';
import type { IRunEvent, IStartRun, IStepOutcome } from '@/types';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { WebDriver } from '@/main/classes/devices/WebDriver';
import { RUN_PROMPTS, RUN_SCHEMAS } from './constants';
import { parseActions, parseVerdict, skippedOutcome } from './library';

/** Walks a plan on a real device: the agent drives, the requirement judges. */
export class RunCoordinator {
  private readonly runner: AgentRunner;
  private readonly findCommand: (agentId: string) => Promise<string | null>;
  private readonly shotRoot: string;
  private readonly onEvent: (event: IRunEvent) => void;
  private readonly stopping = new Set<string>();
  private readonly walking = new Set<string>();

  public constructor(props: IRunCoordinator) {
    this.runner = props.runner;
    this.findCommand = props.findCommand;
    this.shotRoot = props.shotRoot;
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

    this.walking.add(run.workspaceId);

    try {
      await this.walk({ ...run, command, shotDir: join(this.shotRoot, run.runId) });
    } finally {
      this.walking.delete(run.workspaceId);
      this.stopping.delete(run.workspaceId);
    }
  }

  public stop(workspaceId: string): void {
    if (this.walking.has(workspaceId)) this.stopping.add(workspaceId);
  }

  private async walk(run: IWalkRun): Promise<void> {
    const driver = new WebDriver();

    this.stopping.delete(run.workspaceId);

    try {
      await mkdir(run.shotDir, { recursive: true });
      await driver.open(run.url);
    } catch (reason) {
      await driver.close();
      this.onEvent({
        kind: 'failed',
        workspaceId: run.workspaceId,
        text: this.explain(reason),
      });

      return;
    }

    await this.walkSteps({ run, driver });
    await driver.close();
    this.onEvent({ kind: 'done', workspaceId: run.workspaceId });
  }

  private async walkSteps(props: { run: IWalkRun; driver: WebDriver }): Promise<void> {
    const { run, driver } = props;
    const broken = new Set<string>();
    let session: string | null = run.sessionId;
    let walkedCase = '';

    for (const [index, step] of run.steps.entries()) {
      if (this.stopping.has(run.workspaceId)) break;

      if (step.caseId !== walkedCase) {
        walkedCase = step.caseId;
        await this.reopen({ driver, url: run.url });
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

      session = result.session;

      if (result.verdict !== 'passed') broken.add(step.caseId);
    }
  }

  private async walkStep(props: IWalkStep): Promise<IStepResult> {
    const { run, driver, step, index } = props;
    const ask = {
      workspaceId: run.workspaceId,
      agentId: run.agentId,
      model: run.model,
      command: run.command,
    };

    const asked = await this.runner.ask({
      ...ask,
      sessionId: props.session,
      schema: RUN_SCHEMAS.action,
      prompt: RUN_PROMPTS.act({
        action: step.action,
        url: run.url,
        page: await driver.describe(),
      }),
    });

    const broke = await this.carryOut({ driver, answer: asked.text });
    const shot = await driver.shoot(join(run.shotDir, `step-${String(index + 1)}.jpg`));

    const judged = await this.runner.ask({
      ...ask,
      sessionId: asked.sessionId,
      schema: RUN_SCHEMAS.verdict,
      prompt: RUN_PROMPTS.judge({
        action: step.action,
        expected: step.expected,
        page: await driver.describe(),
      }),
    });

    const verdict = parseVerdict(judged.text);

    const outcome: IStepOutcome = {
      workspaceId: run.workspaceId,
      caseId: step.caseId,
      stepNumber: step.numberInCase,
      index,
      action: step.action,
      expected: step.expected,
      verdict: broke === null ? verdict.verdict : 'blocked',
      why: broke ?? verdict.why,
      got: verdict.got,
      screenshot: shot?.dataUrl ?? null,
      shotFile: shot?.file ?? null,
    };

    this.onEvent({ kind: 'step', outcome });

    return { session: judged.sessionId, verdict: outcome.verdict };
  }

  private async carryOut(props: {
    driver: WebDriver;
    answer: string;
  }): Promise<string | null> {
    for (const action of parseActions(props.answer)) {
      try {
        await props.driver.act(action);
      } catch (reason) {
        return this.explain(reason);
      }
    }

    return null;
  }

  private async reopen(props: { driver: WebDriver; url: string }): Promise<void> {
    // Every case starts from the same place, or the one before it decides what this one sees.
    try {
      await props.driver.act({ kind: 'goto', target: props.url, value: '' });
    } catch {
      return;
    }
  }

  private explain(reason: unknown): string {
    return reason instanceof Error ? reason.message : String(reason);
  }
}
