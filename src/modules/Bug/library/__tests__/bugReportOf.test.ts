import type { IBug, IBugReportWords } from '@/modules/Bug/types';
import { describe, expect, it } from 'vitest';
import { bugReportOf } from '@/modules/Bug/library';

const BUG: IBug = {
  id: 'BUG-02',
  severity: 'high',
  title: 'An expired coupon is taken',
  body: 'The checkout took EXPIRED and dropped the total.',
  expected: 'The message "Este cupom expirou"',
  got: 'The total dropped to R$ 90,00',
  runId: 'r-03',
  runWhen: '14:02',
  caseId: 'TC-02',
  caseTitle: 'An expired coupon is refused',
  stepNumber: 2,
  target: 'Web · Chrome 1280 × 800',
  agent: 'Claude Code',
  modelName: null,
  seenRuns: 2,
  repro: [
    { action: 'Open the cart', isBad: false },
    { action: 'Apply EXPIRED', isBad: true },
  ],
  shots: [],
  sightings: [],
  isNew: true,
  isIncidental: false,
  at: 1_760_000_000_000,
  filed: null,
};

/** Words that show where each one lands, the way i18n hands them over. */
const WORDS: IBugReportWords = {
  steps: 'Steps',
  expected: 'Expected',
  got: 'Got',
  requests: 'Failed requests',
  where: 'Where',
  app: 'App',
  target: 'Target',
  run: 'Run',
  runLine: ({ run, when, caseId, step }) =>
    `${run} at ${when}, ${caseId} step ${String(step)}`,
  seen: 'Seen',
  seenRuns: (count) => `in ${String(count)} runs`,
  story: 'Story',
  caughtBy: 'Caught by',
  agentLine: ({ agent, model }) => `${agent} · ${model ?? 'default'}`,
  noAnswer: 'no answer',
  attached: (files) => `Attached: ${files.join(', ')}.`,
  foundWith: 'Found with QAzinho.',
};

const REPORT = {
  bug: BUG,
  title: BUG.title,
  app: null,
  story: null,
  requests: [],
  attached: [],
  words: WORDS,
};

describe('bugReportOf', () => {
  it('writes what the agent saw, how to get there, what was expected and what came', () => {
    expect(bugReportOf(REPORT)).toEqual({
      title: 'An expired coupon is taken',
      blocks: [
        { kind: 'paragraph', text: 'The checkout took EXPIRED and dropped the total.' },
        { kind: 'heading', text: 'Steps' },
        {
          kind: 'steps',
          items: [
            { text: 'Open the cart', isBad: false },
            { text: 'Apply EXPIRED', isBad: true },
          ],
        },
        { kind: 'heading', text: 'Expected' },
        { kind: 'paragraph', text: 'The message "Este cupom expirou"' },
        { kind: 'heading', text: 'Got' },
        { kind: 'paragraph', text: 'The total dropped to R$ 90,00' },
        { kind: 'heading', text: 'Where' },
        {
          kind: 'facts',
          items: [
            { label: 'Target', value: 'Web · Chrome 1280 × 800', url: null },
            { label: 'Run', value: 'r-03 at 14:02, TC-02 step 2', url: null },
            { label: 'Seen', value: 'in 2 runs', url: null },
            { label: 'Caught by', value: 'Claude Code · default', url: null },
          ],
        },
        { kind: 'paragraph', text: 'Found with QAzinho.' },
      ],
    });
  });

  it('adds the app and the story as links, the requests that failed and what goes attached', () => {
    const report = bugReportOf({
      ...REPORT,
      title: '  Coupon EXPIRED accepted ',
      app: 'https://shop.test/checkout',
      story: { key: 'SHOP-12', url: 'https://acme.atlassian.net/browse/SHOP-12' },
      requests: [
        {
          id: 7,
          method: 'POST',
          url: 'https://shop.test/api/coupon',
          type: 'fetch',
          status: 500,
          failure: null,
          startedAt: 1,
          durationMs: 312.4,
          size: 20,
        },
        {
          id: 8,
          method: 'GET',
          url: `https://shop.test/${'a'.repeat(200)}`,
          type: 'fetch',
          status: null,
          failure: null,
          startedAt: 2,
          durationMs: null,
          size: null,
        },
      ],
      attached: ['the screen before', 'a clip of the moment'],
    });

    expect(report.title).toBe('Coupon EXPIRED accepted');
    expect(report.blocks).toContainEqual({
      kind: 'requests',
      items: [
        { call: 'POST https://shop.test/api/coupon', outcome: '500 · 312 ms' },
        { call: `GET https://shop.test/${'a'.repeat(141)}…`, outcome: 'no answer' },
      ],
    });
    expect(report.blocks).toContainEqual(
      expect.objectContaining({
        kind: 'facts',
        items: expect.arrayContaining([
          {
            label: 'App',
            value: 'https://shop.test/checkout',
            url: 'https://shop.test/checkout',
          },
          {
            label: 'Story',
            value: 'SHOP-12',
            url: 'https://acme.atlassian.net/browse/SHOP-12',
          },
        ]),
      }),
    );
    expect(report.blocks.at(-2)).toEqual({
      kind: 'paragraph',
      text: 'Attached: the screen before, a clip of the moment.',
    });
  });

  it('leaves out what the bug does not say, and keeps its own title when the QA cleared it', () => {
    const report = bugReportOf({
      ...REPORT,
      title: ' ',
      bug: { ...BUG, body: '', repro: [], expected: '', got: ' ', agent: '' },
    });

    expect(report.title).toBe('An expired coupon is taken');
    expect(report.blocks.map(({ kind }) => kind)).toEqual([
      'heading',
      'facts',
      'paragraph',
    ]);
  });
});
