import type { IChatReference, IFlatStep } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { Harness } from '@/harness';

/**
 * The files in __prompts__ are what the agent read before the harness moved to src/harness/.
 * Any change to what the agent is told shows up here as a diff of one of them, on purpose.
 */
const STEPS = [
  {
    caseId: 'TC-01',
    caseTitle: 'Coupon',
    numberInCase: 1,
    action: 'Open the cart',
    expected: 'The cart shows',
  },
  {
    caseId: 'TC-01',
    caseTitle: 'Coupon',
    numberInCase: 2,
    action: 'Apply SAVE10',
    expected: '10% off',
  },
] as IFlatStep[];

const REFERENCES: IChatReference[] = [
  {
    kind: 'bug',
    id: 'BUG-01',
    title: 'Expired coupon',
    facts: ['severity high', 'got: accepted'],
  },
];

const harness = new Harness();

describe('Harness', () => {
  describe('chat', () => {
    it('tells the agent about an empty workspace exactly as it did before', async () => {
      const chat = harness.chat({ target: null, steps: [], references: [] });

      await expect(chat.systemPrompt).toMatchFileSnapshot('./__prompts__/chat-empty.txt');
      await expect(chat.schema).toMatchFileSnapshot('./__prompts__/chat-schema.txt');
    });

    it('adds the app, the plan and what the QA pointed at, after the corpus', async () => {
      const chat = harness.chat({
        target: { kind: 'web', value: 'https://shop.test' },
        steps: STEPS,
        references: REFERENCES,
      });

      await expect(chat.systemPrompt).toMatchFileSnapshot('./__prompts__/chat-full.txt');
    });

    it('takes every tool away from the chat', () => {
      expect(harness.chat({ target: null, steps: [], references: [] }).tools).toEqual({
        groups: [],
        allowedTools: [],
      });
    });
  });

  describe('run', () => {
    it.each(['web', 'android', 'ios'] as const)(
      'briefs the agent on the %s device, with the app under test filled in',
      async (kind) => {
        const app = {
          web: 'https://shop.test',
          android: '/tmp/app.apk',
          ios: '/tmp/App.app',
        }[kind];

        await expect(harness.run({ kind, value: app })).toMatchFileSnapshot(
          `./__prompts__/run-${kind}.txt`,
        );
      },
    );

    it('does NOT tell a run how to chat, nor the chat how to run', () => {
      expect(harness.run({ kind: 'web', value: 'x' })).not.toContain(
        '## Talking with the QA',
      );
      expect(
        harness.chat({ target: null, steps: [], references: [] }).systemPrompt,
      ).not.toContain('## Running a case');
    });
  });

  describe('walk', () => {
    it('starts a case with its steps and the screen it starts on', async () => {
      await expect(
        harness.walk({ steps: STEPS, screen: 'Cart\n[button] Apply' }),
      ).toMatchFileSnapshot('./__prompts__/walk.txt');
      await expect(harness.walk({ steps: [], screen: '' })).toMatchFileSnapshot(
        './__prompts__/walk-empty.txt',
      );
    });
  });

  describe('toolsFor', () => {
    it('gives the runner the device, behind QAzinho own MCP server', () => {
      expect(harness.toolsFor('runner')).toEqual({
        groups: ['device'],
        allowedTools: ['mcp__qazinho'],
      });
    });
  });
});
