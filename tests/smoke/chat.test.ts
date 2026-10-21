import type { IChatAnswer } from '@/shared/types';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { Harness } from '@/harness';
import { AgentDetector } from '@/main/classes/agents/AgentDetector';
import { AgentRunner } from '@/main/classes/agents/AgentRunner';
import { ProcessOwners } from '@/main/classes/resources/ProcessOwners';

/**
 * The chat the way main asks it: the harness prompt, the answer schema, no tool. What it guards
 * is the schema reaching the CLI at all: a --json-schema the CLI does not take is ignored in
 * silence, and the agent answers in prose that still reads as a reply, with the plan lost.
 * It also walks the planning protocol the corpus sets: questions first, a confirmation of one
 * option alone, and the plan only once that option is picked. Each round is answered with its
 * first option, in the lines the chat's formatAnswers writes, and with the account a QA would
 * type: an option that says to write a value, picked with nothing written, is asked again.
 */
const ACCOUNT =
  'where an account is needed, use qa@shop.test with the password Test-1234';

describe('a real chat', () => {
  it('asks before it plans, and writes the plan once the QA confirms it', async () => {
    const command = (await new AgentDetector().detect()).find(
      (one) => one.id === 'claude-code',
    )?.path;

    expect(command, 'Claude Code must be installed for this suite').toBeDefined();

    const harness = new Harness();
    const runner = new AgentRunner({
      owners: new ProcessOwners(),
      folder: tmpdir(),
      onEvent: () => undefined,
    });
    const answers: IChatAnswer[] = [];
    let sessionId: string | null = null;
    let told: Record<string, string> = {};
    let prompt = 'Write a test plan for this app.';

    for (let turnNumber = 0; turnNumber < 5; turnNumber += 1) {
      const chat = harness.chat({
        text: prompt,
        told,
        target: { kind: 'web', value: 'https://shop.test' },
        viewport: { width: 1280, height: 800 },
        steps: [],
        references: [],
        runs: [],
        look: null,
      });
      const turn = await runner.ask({
        workspaceId: 'w-chat',
        agentId: 'claude-code',
        command: command ?? 'claude',
        model: 'haiku',
        sessionId,
        prompt: chat.prompt,
        schema: chat.schema,
        systemPrompt: chat.systemPrompt,
        allowedTools: chat.tools.allowedTools,
      });

      expect(turn.isError).toBe(false);

      const answer = harness.readChat(turn.text);

      expect(answer?.reply.length).toBeGreaterThan(0);

      if (!answer || answer.plan !== null || answer.questions.length === 0) {
        if (answer) answers.push(answer);

        break;
      }

      answers.push(answer);
      sessionId = turn.sessionId;
      told = chat.told;
      prompt = answer.questions
        .map(
          ({ header, question, options }) =>
            `${header} (${question}): ${options[0]?.label ?? ''} — ${ACCOUNT}`,
        )
        .join('\n');
    }

    const [first] = answers;
    const written = answers.at(-1);
    const confirmation = answers.at(-2);

    expect(first?.plan).toBeNull();
    expect(first?.questions.length).toBeGreaterThan(0);
    expect(written?.plan?.cases.length).toBeGreaterThan(0);
    expect(confirmation?.questions).toHaveLength(1);
    expect(confirmation?.questions[0]?.options).toHaveLength(1);
  }, 600_000);

  /**
   * Claude Code keeps the system prompt a session started with: a new --append-system-prompt on
   * --resume is ignored in silence. A run that happened after the first message reached the
   * agent only in the system prompt, so the chat said it had no run in sight.
   */
  it('answers about a run it heard of after its first message, on the same session', async () => {
    const command = (await new AgentDetector().detect()).find(
      (one) => one.id === 'claude-code',
    )?.path;

    expect(command, 'Claude Code must be installed for this suite').toBeDefined();

    const harness = new Harness();
    const runner = new AgentRunner({
      owners: new ProcessOwners(),
      folder: tmpdir(),
      onEvent: () => undefined,
    });
    const workspace = {
      target: { kind: 'web' as const, value: 'https://shop.test' },
      viewport: { width: 1280, height: 800 },
      steps: [],
      references: [],
      look: null,
    };
    const ask = (props: {
      chat: ReturnType<Harness['chat']>;
      sessionId: string | null;
    }) =>
      runner.ask({
        workspaceId: 'w-chat-runs',
        agentId: 'claude-code',
        command: command ?? 'claude',
        model: 'haiku',
        sessionId: props.sessionId,
        prompt: props.chat.prompt,
        schema: props.chat.schema,
        systemPrompt: props.chat.systemPrompt,
        allowedTools: props.chat.tools.allowedTools,
      });
    const hello = harness.chat({
      ...workspace,
      text: 'Hi! Just say hello.',
      told: {},
      runs: [],
    });
    const first = await ask({ chat: hello, sessionId: null });
    const question = harness.chat({
      ...workspace,
      text: 'Which coupon failed in the last run?',
      told: hello.told,
      runs: [
        {
          kind: 'run',
          id: 'r-01',
          title: 'The whole plan · 10:02',
          facts: [
            'started 10:02, took 84s, cost $0.041, walked the whole plan',
            '0 passed, 1 failed, 0 blocked, 0 skipped',
            'TC-02 Checkout: failed',
            '  step 1 failed: Apply ZEBRA77 (The expired coupon took 10% off.)',
          ],
        },
      ],
    });
    const second = await ask({ chat: question, sessionId: first.sessionId });

    expect(second.isError).toBe(false);
    expect(harness.readChat(second.text)?.reply).toContain('ZEBRA77');
  }, 300_000);
});
