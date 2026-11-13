import type { ITestCase } from '@/modules/Plan/types';
import type { IRun, IRunCase } from '@/modules/Run/types';
import { describe, expect, it } from 'vitest';
import { manualWaitingOf } from '@/modules/Run/library';

const testCase = (id: string, isManual = false): ITestCase => ({
  id,
  title: id,
  priority: 'P2',
  goal: '',
  preconditions: '',
  lastVerdict: null,
  steps: [{ action: 'Open the invoice', expected: 'It reads well' }],
  ...(isManual ? { isManual } : {}),
});

const walked = (id: string, by?: 'qa'): IRunCase => ({
  id,
  title: id,
  verdict: 'passed',
  durationSec: 1,
  steps: [
    {
      number: 1,
      action: 'Open the invoice',
      verdict: 'passed',
      why: null,
      bugId: null,
      shot: null,
      shotFile: null,
      span: null,
      ...(by === undefined ? {} : { by }),
    },
  ],
});

const run = (id: string, cases: IRunCase[], mode?: 'manual'): IRun => ({
  id,
  meta: '',
  startedAt: '09:41',
  durationSec: 1,
  costUsd: null,
  counts: { passed: cases.length, failed: 0, blocked: 0, skipped: 0 },
  cases,
  endedBy: 'finished',
  video: null,
  ...(mode === undefined ? {} : { mode }),
});

const plan = [testCase('TC-01'), testCase('TC-07', true), testCase('TC-08', true)];

describe('manualWaitingOf', () => {
  it('asks for none before the plan ever ran', () => {
    expect(manualWaitingOf({ plan, runs: [] })).toEqual([]);
  });

  it('asks for every case by hand once the plan ran without them', () => {
    expect(manualWaitingOf({ plan, runs: [run('r-01', [walked('TC-01')])] })).toEqual([
      'TC-07',
      'TC-08',
    ]);
  });

  it('stops asking for a case the QA walked by hand after that run', () => {
    expect(
      manualWaitingOf({
        plan,
        runs: [
          run('r-02', [walked('TC-07', 'qa')], 'manual'),
          run('r-01', [walked('TC-01')]),
        ],
      }),
    ).toEqual(['TC-08']);
  });

  it('asks again once the plan runs again after the QA walked it', () => {
    expect(
      manualWaitingOf({
        plan,
        runs: [
          run('r-03', [walked('TC-01')]),
          run('r-02', [walked('TC-07', 'qa')], 'manual'),
          run('r-01', [walked('TC-01')]),
        ],
      }),
    ).toEqual(['TC-07', 'TC-08']);
  });
});
