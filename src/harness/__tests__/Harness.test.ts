import type { IChatReference, IFlatStep } from '@/shared/types';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { describe, expect, it } from 'vitest';
import { Harness, registerDeviceTools } from '@/harness';

/**
 * The files in __prompts__ are what the agent read before the harness moved to src/harness/.
 * Any change to what the agent is told shows up here as a diff of one of them, on purpose.
 */
const COUPON = {
  caseId: 'TC-01',
  caseTitle: 'Coupon',
  casePriority: 'P1',
  caseGoal: 'A valid coupon takes 10% off.',
  casePreconditions: 'One product in the cart.',
};

const STEPS: IFlatStep[] = [
  { ...COUPON, numberInCase: 1, action: 'Open the cart', expected: 'The cart shows' },
  { ...COUPON, numberInCase: 2, action: 'Apply SAVE10', expected: '10% off' },
];

const REFERENCES: IChatReference[] = [
  {
    kind: 'bug',
    id: 'BUG-01',
    title: 'Expired coupon',
    facts: ['severity high', 'got: accepted'],
  },
];

const RUNS = [
  {
    kind: 'run' as const,
    id: 'r-02',
    title: 'The whole plan · 10:02',
    facts: [
      'started 10:02, took 84s, cost $0.041, walked the whole plan',
      '2 passed, 1 failed, 0 blocked, 0 skipped',
      'TC-02 Checkout: failed',
      '  step 1 failed: Apply EXPIRED10 (The expired coupon took 10% off.)',
      'note: Closed a cookie banner first.',
    ],
  },
];

const harness = new Harness();
const DESKTOP = { width: 1280, height: 800 };

describe('Harness', () => {
  describe('chat', () => {
    it('tells the agent about an empty workspace exactly as it did before', async () => {
      const chat = harness.chat({
        target: null,
        viewport: null,
        steps: [],
        references: [],
        runs: [],
        look: null,
      });

      await expect(chat.systemPrompt).toMatchFileSnapshot('./__prompts__/chat-empty.txt');
      await expect(chat.schema).toMatchFileSnapshot('./__prompts__/chat-schema.txt');
    });

    it('adds the app, what QAzinho saw of it, the plan and what the QA pointed at, after the corpus', async () => {
      const chat = harness.chat({
        target: { kind: 'web', value: 'https://shop.test' },
        viewport: DESKTOP,
        steps: STEPS,
        references: REFERENCES,
        runs: RUNS,
        look: {
          url: 'https://shop.test',
          isOpen: true,
          page: 'URL: https://shop.test/\nTITLE: Shop\nTEXT:\nNew in: summer shoes\nCONTROLS:\na: Cart\nbutton: Sign in',
        },
      });

      await expect(chat.systemPrompt).toMatchFileSnapshot('./__prompts__/chat-full.txt');
    });

    it('tells the chat how the latest runs went, which it never walked itself', () => {
      const prompt = harness.chat({
        target: null,
        viewport: null,
        steps: [],
        references: [],
        runs: RUNS,
        look: null,
      }).systemPrompt;

      expect(prompt).toContain(
        '## Runs in this workspace\nrun r-02 · The whole plan · 10:02',
      );
      expect(prompt).toContain('  note: Closed a cookie banner first.');
    });

    it('says nothing of runs before the first one', () => {
      expect(
        harness.chat({
          target: null,
          viewport: null,
          steps: [],
          references: [],
          runs: [],
          look: null,
        }).systemPrompt,
      ).not.toContain('## Runs in this workspace');
    });

    it('takes every tool away from the chat', () => {
      expect(
        harness.chat({
          target: null,
          viewport: null,
          steps: [],
          references: [],
          runs: [],
          look: null,
        }).tools,
      ).toEqual({
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

        await expect(
          harness.run({
            target: { kind, value: app },
            viewport: DESKTOP,
            language: 'en',
          }),
        ).toMatchFileSnapshot(`./__prompts__/run-${kind}.txt`);
      },
    );

    it('tells a web run the size of the window it drives', () => {
      expect(
        harness.run({
          target: { kind: 'web', value: 'x' },
          viewport: { width: 390, height: 844 },
          language: 'en',
        }),
      ).toContain('in a 390 × 844 window, width by height in pixels');
    });

    it('has the runner write its verdicts in the language the QA reads, whatever the case is in', () => {
      const prompt = harness.run({
        target: { kind: 'web', value: 'x' },
        viewport: DESKTOP,
        language: 'pt',
      });

      expect(prompt).toContain(
        'in Brazilian Portuguese, the language the QA reads QAzinho in',
      );
      expect(prompt).not.toContain('{{language}}');
    });

    it('does NOT tell a run how to chat, nor the chat how to run', () => {
      expect(
        harness.run({
          target: { kind: 'web', value: 'x' },
          viewport: DESKTOP,
          language: 'en',
        }),
      ).not.toContain('## Talking with the QA');
      expect(
        harness.chat({
          target: null,
          viewport: null,
          steps: [],
          references: [],
          runs: [],
          look: null,
        }).systemPrompt,
      ).not.toContain('## Running a case');
    });
  });

  describe('walk', () => {
    it('starts a case with its steps and the screen it starts on', async () => {
      await expect(
        harness.walk({ steps: STEPS, screen: 'Cart\n[button] Apply', language: 'en' }),
      ).toMatchFileSnapshot('./__prompts__/walk.txt');
      await expect(
        harness.walk({ steps: [], screen: '', language: 'en' }),
      ).toMatchFileSnapshot('./__prompts__/walk-empty.txt');
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

  describe('the device tools', () => {
    /** Listed the way the agent lists them: an MCP client over an in-memory pipe, no network. */
    it('lists them to the agent exactly as pinned', async () => {
      const mcp = new McpServer({ name: 'qazinho', version: '0' });
      const client = new Client({ name: 'pin', version: '0' });
      const [ours, theirs] = InMemoryTransport.createLinkedPair();

      registerDeviceTools({ mcp, call: () => Promise.reject(new Error('not called')) });
      await mcp.connect(ours);
      await client.connect(theirs);

      const { tools } = await client.listTools();

      await expect(JSON.stringify(tools, null, 2)).toMatchFileSnapshot(
        './__prompts__/device-tools.txt',
      );
      await client.close();
    });
  });
});
