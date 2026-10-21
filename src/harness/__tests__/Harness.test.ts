import type { IAppSnapshot, IChatReference, ICodeCopy, IFlatStep } from '@/shared/types';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { describe, expect, it } from 'vitest';
import { Harness, registerAppTools, registerDeviceTools } from '@/harness';

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
  code: null,
};

const CODE: ICodeCopy = {
  repository: 'acme/loja-web',
  branch: 'feat/cupom',
  base: 'develop',
  commit: 'aaa1111222233334444',
  baseCommit: 'bbb2222333344445555',
  root: '/data/code/w-1',
  dir: '/data/code/w-1/acme/loja-web',
  diffFile: '/data/code/w-1/acme-loja-web.diff',
  changes: [{ path: 'src/Coupon.tsx', status: 'modified', additions: 40, deletions: 3 }],
  changedFiles: 1,
  commits: 2,
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
  code: null,
};

const APP: IAppSnapshot = {
  screen: 'workspace',
  openWorkspaceId: 'w-1',
  openTab: 'bugs',
  openRunId: null,
  openBugId: 'BUG-01',
  language: 'pt',
  theme: 'night',
  runAlert: 'system',
  agent: 'Claude Code',
  integrations: [
    { id: 'github', account: 'octoqa' },
    { id: 'jira', account: null },
  ],
  projects: [
    {
      id: 'p-1',
      name: 'Shop',
      targets: [{ kind: 'web', value: 'https://shop.test' }],
      repositories: [{ name: 'acme/shop-web', base: 'main' }],
    },
  ],
  workspaces: [
    {
      id: 'w-1',
      name: 'Coupons',
      projectId: 'p-1',
      target: 'web',
      cases: 1,
      steps: 2,
      runs: 1,
      bugs: 1,
      latestRun: {
        id: 'r-02',
        startedAt: '10:02',
        endedBy: 'finished',
        passed: 1,
        failed: 1,
        blocked: 0,
        skipped: 0,
      },
      isRunning: false,
      isAnswering: false,
    },
  ],
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

    it('opens a message planned from code with the branch, its diff, and the folder the agent may read', async () => {
      const chat = harness.chat({
        ...EMPTY_CHAT,
        text: 'Plan from this branch.',
        code: CODE,
      });

      await expect(chat.prompt).toMatchFileSnapshot('./__prompts__/chat-code.txt');
      expect(chat.readDirs).toEqual(['/data/code/w-1']);
      expect(harness.chat(EMPTY_CHAT).readDirs).toEqual([]);
    });

    it('tells the agent once that the copy is gone after the plan, and never again', () => {
      const planning = harness.chat({ ...EMPTY_CHAT, code: CODE });
      const after = harness.chat({ ...EMPTY_CHAT, told: planning.told, text: 'Thanks' });

      expect(after.prompt).toContain('The copy of the code is gone');
      expect(
        harness.chat({ ...EMPTY_CHAT, told: after.told, text: 'And now?' }).prompt,
      ).toBe('And now?');
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

  describe('assistant', () => {
    it('briefs the Estagiário in the corner, and nothing of a chat or a run', async () => {
      const { systemPrompt } = harness.assistant({ text: 'Oi', told: {}, app: APP });

      await expect(systemPrompt).toMatchFileSnapshot('./__prompts__/assistant.txt');
      expect(systemPrompt).not.toContain('## Talking with the QA');
      expect(systemPrompt).not.toContain('## Running a case');
    });

    it('opens the first message with what is on screen and every project and workspace', async () => {
      await expect(
        harness.assistant({ text: 'What broke in Coupons?', told: {}, app: APP }).prompt,
      ).toMatchFileSnapshot('./__prompts__/assistant-message.txt');
    });

    it('tells a resumed assistant only what changed, and nothing when nothing did', () => {
      const first = harness.assistant({ text: 'Oi', told: {}, app: APP });
      const moved = harness.assistant({
        text: 'And this one?',
        told: first.told,
        app: { ...APP, openTab: 'plan', openBugId: null },
      });

      expect(moved.prompt).toContain(
        '## On screen\nThe QA is on the workspace "Coupons" (w-1), on its plan tab.',
      );
      expect(moved.prompt).not.toContain('## QAzinho now');
      expect(
        harness.assistant({
          text: 'Thanks',
          told: moved.told,
          app: { ...APP, openTab: 'plan', openBugId: null },
        }).prompt,
      ).toBe('Thanks');
    });

    it('gives the assistant the app tools behind QAzinho own MCP server', () => {
      expect(harness.assistant({ text: 'Oi', told: {}, app: APP }).tools).toEqual({
        groups: ['app'],
        allowedTools: ['mcp__qazinho'],
      });
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

  describe('the app tools', () => {
    /** Listed the way the assistant lists them: an MCP client over an in-memory pipe, no network. */
    it('lists them to the agent exactly as pinned', async () => {
      const mcp = new McpServer({ name: 'qazinho', version: '0' });
      const client = new Client({ name: 'pin', version: '0' });
      const [ours, theirs] = InMemoryTransport.createLinkedPair();

      registerAppTools({ mcp, call: () => Promise.reject(new Error('not called')) });
      await mcp.connect(ours);
      await client.connect(theirs);

      const { tools } = await client.listTools();

      await expect(JSON.stringify(tools, null, 2)).toMatchFileSnapshot(
        './__prompts__/app-tools.txt',
      );
      await client.close();
    });
  });
});
