import type { IWorkspace } from '@/modules/Workspace/types';
import type { IStepOutcome } from '@/shared/types';
import {
  makeOutcome,
  WALKED_BY,
  walkRun,
} from '@/modules/Workspace/library/__tests__/fixtures';
import { startRun } from '@/modules/Workspace/library/startRun';

/** r-01 failed TC-02's second step, which became BUG-01, and r-02 has just started. */
export function secondRun(): IWorkspace {
  return startRun({
    workspace: walkRun({
      verdicts: ['passed', 'passed', 'passed', 'passed', 'failed'],
      isFinished: true,
    }),
    startedAt: '10:05',
    runId: 'r-02',
    by: WALKED_BY,
  });
}

/** TC-02's second step failing again in the run walking now, at a later moment than r-01's. */
export function failedAgain(workspace: IWorkspace): IStepOutcome {
  return {
    ...makeOutcome({ workspace, index: 4, verdict: 'failed' }),
    title: 'Submit does nothing',
    at: 1_760_000_100_000,
    screenshot: 'data:image/jpeg;base64,again',
    shotFile: '/tmp/qazinho/r-02/step-5.jpg',
  };
}
