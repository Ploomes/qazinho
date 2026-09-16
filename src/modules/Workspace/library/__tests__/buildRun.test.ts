import type { StepVerdict } from '@/modules/Run/types';
import { describe, expect, it } from 'vitest';
import { buildRun, startRun } from '@/modules/Workspace/library';
import { makeWorkspace } from './fixtures';

const VERDICTS: StepVerdict[] = [
  'passed',
  'passed',
  'passed',
  'passed',
  'failed',
  'skipped',
];

function workspaceWithVerdicts() {
  const running = startRun({ workspace: makeWorkspace(), startedAt: '09:41' });

  return {
    ...running,
    live: {
      ...running.live!,
      verdicts: VERDICTS,
    },
  };
}

describe('buildRun', () => {
  it('groups the steps back under the case they came from', () => {
    const run = buildRun({ workspace: workspaceWithVerdicts(), runNumber: 1 });

    expect(run.cases.map(({ id }) => id)).toEqual(['TC-01', 'TC-02']);
    expect(run.cases[0]?.steps).toHaveLength(3);
  });

  it('fails a case as soon as one of its steps failed', () => {
    const run = buildRun({ workspace: workspaceWithVerdicts(), runNumber: 1 });

    expect(run.cases[0]?.verdict).toBe('passed');
    expect(run.cases[1]?.verdict).toBe('failed');
  });

  it('says why a step was skipped, so the QA does not read it as a pass', () => {
    const run = buildRun({ workspace: workspaceWithVerdicts(), runNumber: 1 });
    const skipped = run.cases[1]?.steps.find(({ verdict }) => verdict === 'skipped');

    expect(skipped?.why).toBe('Skipped because the step before it failed.');
  });

  it('numbers the run after the ones already filed', () => {
    const run = buildRun({ workspace: workspaceWithVerdicts(), runNumber: 4 });

    expect(run.id).toBe('r-04');
  });
});
