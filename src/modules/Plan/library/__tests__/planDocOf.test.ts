import type { IPlanDocWords, ITestCase } from '@/modules/Plan/types';
import type { IRun } from '@/modules/Run/types';
import { describe, expect, it } from 'vitest';
import { planDocOf } from '@/modules/Plan/library';

const WORDS: IPlanDocWords = {
  intro: ({ cases, steps }) => `${String(cases)} cases, ${String(steps)} steps.`,
  story: 'Story',
  page: 'Made from',
  design: 'Design',
  lastRun: 'Last run',
  runLine: ({ run, when }) => `${run}, ${when}`,
  priority: 'Priority',
  goal: 'Goal',
  preconditions: 'Preconditions',
  action: 'Action',
  expected: 'Expected',
  frame: 'Figma',
  result: 'Result',
  strategy: 'Strategy',
  strategyParts: {
    covers: 'Covers',
    leavesOut: 'Leaves out',
    where: 'Where',
    data: 'Data',
    risks: 'Risks',
  },
  doubts: 'Doubts',
  doubt: 'Doubt',
  answer: 'Answer',
  doubtWaiting: 'Waiting on the team',
  doubtNotSent: 'Not sent yet',
  sources: 'Source',
  source: (source) => source.replace(/^C(\d+)$/, 'criterion $1'),
  waitsOn: 'Waits on',
  verdicts: {
    pending: 'pending',
    running: 'running',
    passed: 'passed',
    failed: 'failed',
    blocked: 'blocked',
    skipped: 'skipped',
  },
  keptBy: 'Kept by QAzinho.',
  gherkin: {
    language: 'en',
    feature: 'Feature',
    scenario: 'Scenario',
    given: 'Given',
    when: 'When',
    then: 'Then',
  },
};

const COUPON: ITestCase = {
  id: 'TC-01',
  title: 'Apply a coupon',
  priority: 'P1',
  goal: 'SAVE10 takes 10% off',
  preconditions: '',
  steps: [
    { action: 'Type SAVE10', expected: 'The field holds it' },
    { action: 'Apply', expected: 'The total drops 10%', frame: '12:34' },
  ],
  lastVerdict: 'failed',
};

const RUN: IRun = {
  id: 'RUN-03',
  meta: '',
  startedAt: '2026-10-22T10:00:00.000Z',
  durationSec: 40,
  costUsd: null,
  counts: { passed: 0, failed: 1, blocked: 0, skipped: 0 },
  cases: [
    {
      id: 'TC-01',
      title: 'Apply a coupon',
      verdict: 'failed',
      durationSec: 40,
      steps: [
        {
          number: 1,
          action: 'Type SAVE10',
          verdict: 'passed',
          why: null,
          bugId: null,
          shot: null,
          shotFile: null,
          span: null,
        },
        {
          number: 2,
          action: 'Apply',
          verdict: 'failed',
          why: 'No discount',
          bugId: 'BUG-01',
          shot: null,
          shotFile: null,
          span: null,
        },
      ],
    },
  ],
  endedBy: 'finished',
  video: null,
};

describe('planDocOf', () => {
  it('writes each case with its facts and its steps as a table, with how the last run went', () => {
    expect(
      planDocOf({
        plan: [COUPON],
        run: RUN,
        when: 'Oct 22, 10:00',
        story: { key: 'SHOP-12', url: 'https://acme.atlassian.net/browse/SHOP-12' },
        page: null,
        design: null,
        words: WORDS,
      }),
    ).toEqual([
      { kind: 'paragraph', text: '1 cases, 2 steps.' },
      {
        kind: 'facts',
        items: [
          {
            label: 'Story',
            value: 'SHOP-12',
            url: 'https://acme.atlassian.net/browse/SHOP-12',
          },
          { label: 'Last run', value: 'RUN-03, Oct 22, 10:00', url: null },
        ],
      },
      { kind: 'heading', text: 'TC-01 Apply a coupon' },
      {
        kind: 'facts',
        items: [
          { label: 'Priority', value: 'P1', url: null },
          { label: 'Goal', value: 'SAVE10 takes 10% off', url: null },
        ],
      },
      {
        kind: 'table',
        head: ['#', 'Action', 'Expected', 'Result'],
        rows: [
          ['1', 'Type SAVE10', 'The field holds it', 'passed'],
          ['2', 'Apply', 'The total drops 10%', 'failed'],
        ],
      },
      { kind: 'paragraph', text: 'Kept by QAzinho.' },
    ]);
  });

  it('adds a column for the Figma frame when the workspace has a design', () => {
    const blocks = planDocOf({
      plan: [COUPON],
      run: null,
      when: '',
      story: null,
      page: null,
      design: {
        url: 'https://www.figma.com/design/AbC/Shop?node-id=1-2',
        fileKey: 'AbC',
        name: 'Shop',
        nodeId: '1:2',
      },
      words: WORDS,
    });

    expect(blocks.find(({ kind }) => kind === 'table')).toEqual({
      kind: 'table',
      head: ['#', 'Action', 'Expected', 'Figma'],
      rows: [
        ['1', 'Type SAVE10', 'The field holds it', ''],
        [
          '2',
          'Apply',
          'The total drops 10%',
          'https://www.figma.com/design/AbC/Shop?node-id=12-34',
        ],
      ],
    });
  });

  it('leaves out what the plan has nothing for: no sources, no run, a case with no steps', () => {
    const blocks = planDocOf({
      plan: [{ ...COUPON, goal: ' ', steps: [] }],
      run: null,
      when: '',
      story: null,
      page: null,
      design: null,
      words: WORDS,
    });

    expect(blocks.map(({ kind }) => kind)).toEqual([
      'paragraph',
      'heading',
      'facts',
      'paragraph',
    ]);
  });

  /** Quem lê o plano no Confluence vê o que ele cobre e o que ainda depende do time. */
  it('writes the strategy and the doubts after where the plan came from', () => {
    const sent = {
      url: 'https://shop.atlassian.net/browse/SHOP-878',
      at: '2026-11-13T13:00:00.000Z',
    };
    const blocks = planDocOf({
      plan: [{ ...COUPON, sources: ['C1', 'C2'], blockedBy: ['D2'] }],
      strategy: {
        covers: 'Coupons at checkout',
        leavesOut: '',
        where: 'Staging',
        data: '',
        risks: 'A coupon that stacks',
      },
      doubts: [
        {
          id: 'D1',
          question: 'Does a coupon stack?',
          sent,
          answer: { text: 'No.', by: 'Rui PO', at: '2026-11-13T15:00:00.000Z' },
        },
        { id: 'D2', question: 'Which error shows?', sent, answer: null },
        { id: 'D3', question: 'A limit per buyer?', sent: null, answer: null },
      ],
      run: null,
      when: '',
      story: null,
      page: null,
      design: null,
      words: WORDS,
    });

    expect(blocks.slice(1, 5)).toEqual([
      { kind: 'heading', text: 'Strategy' },
      {
        kind: 'facts',
        items: [
          { label: 'Covers', value: 'Coupons at checkout', url: null },
          { label: 'Where', value: 'Staging', url: null },
          { label: 'Risks', value: 'A coupon that stacks', url: null },
        ],
      },
      { kind: 'heading', text: 'Doubts' },
      {
        kind: 'table',
        head: ['#', 'Doubt', 'Answer'],
        rows: [
          ['D1', 'Does a coupon stack?', 'No. (Rui PO)'],
          ['D2', 'Which error shows?', 'Waiting on the team'],
          ['D3', 'A limit per buyer?', 'Not sent yet'],
        ],
      },
    ]);
    expect(blocks[6]).toMatchObject({
      kind: 'facts',
      items: expect.arrayContaining([
        { label: 'Source', value: 'criterion 1, criterion 2', url: null },
        { label: 'Waits on', value: 'D2', url: null },
      ]) as unknown,
    });
  });

  /** O modelo do time escolhe a ordem, os títulos e o formato dos casos. */
  it('lays the page out by the team’s template, with the cases in Gherkin', () => {
    const blocks = planDocOf({
      name: 'Cupom no checkout',
      plan: [COUPON],
      run: null,
      when: '13/11/2026',
      story: { key: 'SHOP-878', url: 'https://shop.atlassian.net/browse/SHOP-878' },
      page: null,
      design: null,
      words: WORDS,
      template: {
        id: 't-plan',
        kind: 'plan',
        name: 'Plano do time',
        title: '',
        parts: [
          { kind: 'text', text: 'Plano {{plan}}, da {{story}}, em {{date}}.' },
          { kind: 'section', field: 'cases', heading: 'Cenários' },
        ],
        cases: 'gherkin',
        updatedAt: '',
      },
    });

    expect(blocks).toEqual([
      { kind: 'paragraph', text: 'Plano Cupom no checkout, da SHOP-878, em 13/11/2026.' },
      { kind: 'heading', text: 'Cenários' },
      {
        kind: 'code',
        text: [
          '# language: en',
          'Feature: Cupom no checkout',
          '',
          '  @P1',
          '  Scenario: TC-01 Apply a coupon',
          '    When Type SAVE10',
          '    Then The field holds it',
          '    When Apply',
          '    Then The total drops 10%',
        ].join('\n'),
      },
    ]);
  });
});
