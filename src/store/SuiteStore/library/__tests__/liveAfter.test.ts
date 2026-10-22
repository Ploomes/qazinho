import type { ISuiteResult, ISuiteRun } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { liveAfter } from '@/store/SuiteStore/library';

const RUN: ISuiteRun = {
  id: 's-01',
  projectId: 'p-1',
  startedAt: 1,
  endedAt: null,
  status: 'running',
  total: 0,
  results: [],
  failure: null,
  said: '',
};

const ENDED: ISuiteResult = {
  testId: 't-1',
  title: 'x',
  file: 'a.spec.ts',
  line: 1,
  project: '',
  status: 'passed',
  isFlaky: false,
  durationMs: 1,
  error: null,
  attachments: [],
};

describe('liveAfter', () => {
  it('opens a run with nothing going yet', () => {
    expect(liveAfter({ live: null, event: { kind: 'started', run: RUN } })).toEqual({
      runId: 's-01',
      going: {},
    });
  });

  it('follows each test running at once, with the step it is on', () => {
    let live = liveAfter({ live: null, event: { kind: 'started', run: RUN } });

    live = liveAfter({
      live,
      event: { kind: 'testStarted', projectId: 'p-1', runId: 's-01', testId: 't-1' },
    });
    live = liveAfter({
      live,
      event: { kind: 'testStarted', projectId: 'p-1', runId: 's-01', testId: 't-2' },
    });
    live = liveAfter({
      live,
      event: {
        kind: 'step',
        projectId: 'p-1',
        runId: 's-01',
        testId: 't-2',
        title: 'Salvar',
      },
    });

    expect(live?.going).toEqual({ 't-1': null, 't-2': 'Salvar' });
  });

  it('lets a test go once it ended', () => {
    const live = liveAfter({
      live: { runId: 's-01', going: { 't-1': 'Abrir', 't-2': null } },
      event: { kind: 'testEnded', projectId: 'p-1', runId: 's-01', result: ENDED },
    });

    expect(live?.going).toEqual({ 't-2': null });
  });

  it('closes when its run ends, and not for another run', () => {
    const live = { runId: 's-01', going: {} };

    expect(liveAfter({ live, event: { kind: 'ended', run: RUN } })).toBeNull();
    expect(
      liveAfter({ live, event: { kind: 'ended', run: { ...RUN, id: 's-00' } } }),
    ).toBe(live);
  });

  it('does NOT follow a test of a run it is not on', () => {
    const live = { runId: 's-01', going: {} };

    expect(
      liveAfter({
        live,
        event: { kind: 'testStarted', projectId: 'p-1', runId: 's-09', testId: 't-1' },
      }),
    ).toBe(live);
    expect(
      liveAfter({
        live: null,
        event: { kind: 'testStarted', projectId: 'p-1', runId: 's-01', testId: 't-1' },
      }),
    ).toBeNull();
  });
});
