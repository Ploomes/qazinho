import type { IRun } from '@/modules/Run/types';
import type { IWorkspace } from '@/modules/Workspace';
import { describe, expect, it } from 'vitest';
import { nextRunId } from '@/modules/Run/library';

const run = (id: string) => ({ id }) as IRun;

const broke = (runId: string): IWorkspace['chat'][number] => ({
  id: 'm-9',
  kind: 'error',
  runId,
  at: '10:00',
  text: 'Chrome could not open the app.',
  detail: null,
  fix: null,
});

describe('nextRunId', () => {
  it('names the first run r-01', () => {
    expect(nextRunId({ runs: [], chat: [] })).toBe('r-01');
  });

  it('goes one past the runs kept', () => {
    expect(nextRunId({ runs: [run('r-02'), run('r-01')], chat: [] })).toBe('r-03');
  });

  it('does NOT name again a run that broke before its first step and was never kept', () => {
    expect(nextRunId({ runs: [run('r-01')], chat: [broke('r-02')] })).toBe('r-03');
  });

  it('keeps counting past r-99', () => {
    expect(nextRunId({ runs: [run('r-100')], chat: [] })).toBe('r-101');
  });
});
