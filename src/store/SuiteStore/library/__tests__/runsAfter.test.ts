import type { ISuiteResult, ISuiteRun } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { runsAfter } from '@/store/SuiteStore/library';

const run = (props: Partial<ISuiteRun>): ISuiteRun => ({
  id: 's-01',
  projectId: 'p-1',
  startedAt: 1,
  endedAt: null,
  status: 'running',
  total: 0,
  results: [],
  failure: null,
  said: '',
  ...props,
});

const result = (props: Partial<ISuiteResult>): ISuiteResult => ({
  testId: 't-1',
  title: 'CT-NAV-001',
  file: 'tests/a.spec.ts',
  line: 3,
  project: 'chromium',
  status: 'passed',
  isFlaky: false,
  durationMs: 10,
  error: null,
  attachments: [],
  ...props,
});

describe('runsAfter', () => {
  it('puts a run that starts first, in place of an older copy of it', () => {
    const older = run({ id: 's-00', status: 'passed' });

    expect(
      runsAfter({
        runs: [run({}), older],
        event: { kind: 'started', run: run({ total: 0 }) },
      }).map(({ id }) => id),
    ).toEqual(['s-01', 's-00']);
  });

  it('counts the tests a run holds as Playwright tells', () => {
    expect(
      runsAfter({
        runs: [run({})],
        event: { kind: 'total', projectId: 'p-1', runId: 's-01', total: 40 },
      })[0]?.total,
    ).toBe(40);
  });

  it('lands a test that ended in its run, in place of a try before it', () => {
    const runs = runsAfter({
      runs: [run({ results: [result({ status: 'failed' })] })],
      event: {
        kind: 'testEnded',
        projectId: 'p-1',
        runId: 's-01',
        result: result({ status: 'passed', isFlaky: true }),
      },
    });

    expect(runs[0]?.results).toEqual([result({ status: 'passed', isFlaky: true })]);
  });

  it('gives a run that ended its final shape', () => {
    const ended = run({ status: 'failed', endedAt: 9, results: [result({})] });

    expect(runsAfter({ runs: [run({})], event: { kind: 'ended', run: ended } })).toEqual([
      ended,
    ]);
  });

  it('keeps a run that ended though it never heard it start', () => {
    expect(
      runsAfter({ runs: [], event: { kind: 'ended', run: run({ status: 'broke' }) } }),
    ).toHaveLength(1);
  });

  it('leaves the runs as they were on a step', () => {
    const runs = [run({})];

    expect(
      runsAfter({
        runs,
        event: {
          kind: 'step',
          projectId: 'p-1',
          runId: 's-01',
          testId: 't-1',
          title: 'Abrir',
        },
      }),
    ).toBe(runs);
  });
});
