import { describe, expect, it } from 'vitest';
import { Harness } from '@/harness';
import { AgentDetector } from '@/main/classes/agents/AgentDetector';
import { AgentRunner } from '@/main/classes/agents/AgentRunner';
import { ProcessOwners } from '@/main/classes/resources/ProcessOwners';

/**
 * The chat the way main asks it: the harness prompt, the answer schema, no tool. What it guards
 * is the schema reaching the CLI at all: a --json-schema the CLI does not take is ignored in
 * silence, and the agent answers in prose that still reads as a reply, with the plan lost.
 */
describe('a real chat', () => {
  it('answers in the schema, with a plan the harness can read', async () => {
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
    const turn = await new AgentRunner({
      owners: new ProcessOwners(),
      onEvent: () => undefined,
    }).ask({
      workspaceId: 'w-chat',
      command: command ?? 'claude',
      model: 'haiku',
      sessionId: null,
      prompt: 'Write a plan with one case for the login form.',
      schema: chat.schema,
      systemPrompt: chat.systemPrompt,
      allowedTools: chat.tools.allowedTools,
    });

    expect(turn.isError).toBe(false);

    const answer = harness.readChat(turn.text);

    expect(answer?.reply.length).toBeGreaterThan(0);
    expect(answer?.plan?.cases.length).toBeGreaterThan(0);
  }, 180_000);
});
