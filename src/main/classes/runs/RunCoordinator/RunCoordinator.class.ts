import type { IRunCoordinator, IWalkRun } from './types';
import type { AgentRunner } from '@/main/classes/agents/AgentRunner';
import type { IFlatStep, IRunEvent, IStepOutcome } from '@/types';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { WebDriver } from '@/main/classes/devices/WebDriver';
import { RUN_PROMPTS, RUN_SCHEMAS } from './constants';
import { parseActions, parseVerdict } from './library';

/** Walks a plan on a real device: the agent drives, the requirement judges. */
export class RunCoordinator {
  private readonly runner: AgentRunner;
  private readonly onEvent: (event: IRunEvent) => void;
  private readonly stopping = new Set<string>();

  public constructor(props: IRunCoordinator) {
    this.runner = props.runner;
    this.onEvent = props.onEvent;
  }

  public async walk(props: IWalkRun): Promise<void> {
    const { workspaceId, steps, shotDir } = props;
    const driver = new WebDriver();

    this.stopping.delete(workspaceId);

    try {
      await mkdir(shotDir, { recursive: true });
      await driver.open(props.url);
    } catch (reason) {
      await driver.close();
      this.onEvent({ kind: 'failed', workspaceId, text: this.explain(reason) });

      return;
    }

    let session: string | null = null;

    for (const [index, step] of steps.entries()) {
      if (this.stopping.has(workspaceId)) break;

      this.onEvent({ kind: 'doing', workspaceId, index });

      session = await this.walkStep({ props, driver, step, index, session });
    }

    await driver.close();
    this.stopping.delete(workspaceId);
    this.onEvent({ kind: 'done', workspaceId });
  }

  public stop(workspaceId: string): void {
    this.stopping.add(workspaceId);
  }

  private async walkStep(props: {
    props: IWalkRun;
    driver: WebDriver;
    step: IFlatStep;
    index: number;
    session: string | null;
  }): Promise<string | null> {
    const { driver, step, index } = props;
    const { workspaceId, agentId, model, shotDir } = props.props;
    const ask = { workspaceId, agentId, model };

    const before = await driver.describe();
    const asked = await this.runner.ask({
      ...ask,
      command: props.props.command,
      sessionId: props.session,
      schema: RUN_SCHEMAS.action,
      prompt: RUN_PROMPTS.act({
        action: step.action,
        url: props.props.url,
        page: before,
      }),
    });

    let broke: string | null = null;

    for (const action of parseActions(asked.text)) {
      try {
        await driver.act(action);
      } catch (reason) {
        broke = this.explain(reason);
        break;
      }
    }

    const shot = await driver.shoot(join(shotDir, `step-${String(index + 1)}.jpg`));
    const after = await driver.describe();

    const judged = await this.runner.ask({
      ...ask,
      command: props.props.command,
      sessionId: asked.sessionId,
      schema: RUN_SCHEMAS.verdict,
      prompt: RUN_PROMPTS.judge({
        action: step.action,
        expected: step.expected,
        page: after,
      }),
    });

    const verdict = parseVerdict(judged.text);

    const outcome: IStepOutcome = {
      workspaceId,
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

    return judged.sessionId;
  }

  private explain(reason: unknown): string {
    return reason instanceof Error ? reason.message : String(reason);
  }
}
