import type { IWorkspace } from '@/modules/Workspace/types';
import type { IStepOutcome } from '@/shared/types';
import {
  makeOutcome,
  WALKED_BY,
  walkRun,
} from '@/modules/Workspace/library/__tests__/fixtures';
import { startRun } from '@/modules/Workspace/library/startRun';

/**
 * A r-01 falhou o segundo passo do TC-02, que virou o BUG-01, e a r-02 acabou de começar.
 */
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

/**
 * O segundo passo do TC-02 falhando de novo na run que anda agora, num momento posterior
 * ao da r-01.
 */
export function failedAgain(workspace: IWorkspace): IStepOutcome {
  return {
    ...makeOutcome({ workspace, index: 4, verdict: 'failed' }),
    title: 'Submit does nothing',
    at: 1_760_000_100_000,
    screenshot: 'data:image/jpeg;base64,again',
    shotFile: '/tmp/qazinho/r-02/step-5.jpg',
  };
}
