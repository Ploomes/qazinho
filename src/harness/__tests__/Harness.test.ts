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
      'cases: 1 passed, 1 failed, 0 blocked, 0 skipped',
      'steps: 2 passed, 1 failed, 0 blocked, 0 skipped',
      'TC-02 Checkout: failed',
      '  step 1 failed: Apply EXPIRED10 (The expired coupon took 10% off.)',
      'note: Closed a cookie banner first.',
    ],
  },
];

const harness = new Harness();
const DESKTOP = { width: 1280, height: 800 };

const EMPTY_CHAT = {
  text: 'Hi',
  told: {},
  target: null,
  viewport: null,
  steps: [],
  references: [],
  runs: [],
  look: null,
};

const FULL_CHAT = {
  text: 'Write a test plan for this app.',
  told: {},
  target: { kind: 'web' as const, value: 'https://shop.test' },
  viewport: DESKTOP,
  steps: STEPS,
  references: REFERENCES,
  runs: RUNS,
  look: {
    url: 'https://shop.test',
    isOpen: true as const,
    page: 'URL: https://shop.test/\nTITLE: Shop\nTEXT:\nNew in: summer shoes\nCONTROLS:\na: Cart\nbutton: Sign in',
  },
};

describe('Harness', () => {
  describe('chat', () => {
    it('keeps the corpus alone in the system prompt, the one a resumed session holds on to', async () => {
      const chat = harness.chat(EMPTY_CHAT);

      await expect(chat.systemPrompt).toMatchFileSnapshot('./__prompts__/chat.txt');
      await expect(chat.schema).toMatchFileSnapshot('./__prompts__/chat-schema.txt');
    });

    it('opens the first message with the app, the plan, the runs, what QAzinho saw and what the QA pointed at', async () => {
      await expect(harness.chat(FULL_CHAT).prompt).toMatchFileSnapshot(
        './__prompts__/chat-message.txt',
      );
    });

    it('does NOT change the system prompt with what the workspace holds', () => {
      expect(harness.chat(FULL_CHAT).systemPrompt).toBe(
        harness.chat(EMPTY_CHAT).systemPrompt,
      );
    });

    it('tells a resumed chat what changed since its last message, and what the QA points at each time', () => {
      const first = harness.chat({ ...FULL_CHAT, runs: [] });
      const second = harness.chat({
        ...FULL_CHAT,
        told: first.told,
        text: 'What failed?',
      });

      expect(second.prompt).toContain(
        '## Runs in this workspace\nrun r-02 · The whole plan · 10:02',
      );
      expect(second.prompt).toContain('## What the QA pointed at\nbug BUG-01');
      expect(second.prompt).not.toContain('## This workspace');
      expect(second.prompt).not.toContain('## What QAzinho saw of the app');
      expect(second.prompt.endsWith('</qazinho>\n\nWhat failed?')).toBe(true);
    });

    it('sends the QA words alone when nothing changed and nothing is pointed at', () => {
      const first = harness.chat(EMPTY_CHAT);

      expect(
        harness.chat({ ...EMPTY_CHAT, told: first.told, text: 'Thanks' }).prompt,
      ).toBe('Thanks');
    });

    it('tells the chat how the latest runs went, which it never walked itself', () => {
      const { prompt } = harness.chat({ ...EMPTY_CHAT, runs: RUNS });

      expect(prompt).toContain(
        '## Runs in this workspace\nrun r-02 · The whole plan · 10:02',
      );
      expect(prompt).toContain('  note: Closed a cookie banner first.');
    });

    it('says nothing of runs before the first one', () => {
      expect(harness.chat(EMPTY_CHAT).prompt).not.toContain('## Runs in this workspace');
    });

    it('takes every tool away from the chat', () => {
      expect(harness.chat(EMPTY_CHAT).tools).toEqual({
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
      expect(harness.chat(EMPTY_CHAT).systemPrompt).not.toContain('## Running a case');
    });
  });

  describe('walk', () => {
    it('starts a case with its steps and the screen it starts on', async () => {
      await expect(
        harness.walk({
          steps: STEPS,
          screen: 'Cart\n[button] Apply',
          language: 'en',
          filed: [],
        }),
      ).toMatchFileSnapshot('./__prompts__/walk.txt');
      await expect(
        harness.walk({ steps: [], screen: '', language: 'en', filed: [] }),
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
