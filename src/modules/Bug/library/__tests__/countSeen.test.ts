import type { StepVerdict } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { countSeen } from '@/modules/Bug/library';
import { walkRun } from '@/modules/Workspace/library/__tests__/fixtures';

const BROKE: StepVerdict[] = ['passed', 'passed', 'passed', 'passed', 'failed'];
const AT = { caseId: 'TC-02', step: 'step 2' };

describe('countSeen', () => {
  it('a workspace with no runs behind it has seen this once', () => {
    const workspace = walkRun({ verdicts: BROKE });

    expect(countSeen({ workspace, ...AT })).toBe('once');
  });

  it('counts the runs that caught the same step, and this one with them', () => {
    const first = walkRun({ verdicts: BROKE, isFinished: true });
    const second = walkRun({ workspace: first, verdicts: BROKE });

    expect(countSeen({ workspace: second, ...AT })).toBe('2 runs in a row');
  });

  it('a run where that step passed does not count', () => {
    const clean = walkRun({ verdicts: ['passed', 'passed'], isFinished: true });

    expect(countSeen({ workspace: clean, ...AT })).toBe('once');
  });
});
