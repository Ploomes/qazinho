import type { IChatAnswer } from '@/shared/types';
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
    const chat = harness.chat({
      target: { kind: 'web', value: 'https://shop.test' },
      steps: [],
      references: [],
    });
    const runner = new AgentRunner({
      owners: new ProcessOwners(),
      onEvent: () => undefined,
    });
    const answers: IChatAnswer[] = [];
    let sessionId: string | null = null;
    let prompt = 'Write a test plan for this app.';

    for (let turnNumber = 0; turnNumber < 5; turnNumber += 1) {
      const turn = await runner.ask({
        workspaceId: 'w-chat',
        agentId: 'claude-code',
        command: command ?? 'claude',
        model: 'haiku',
        sessionId,
        prompt,
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
});
