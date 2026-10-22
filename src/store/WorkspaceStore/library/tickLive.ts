import type { IWorkspace } from '@/modules/Workspace';

/** A held run stops counting: the clock says how long the device has been worked, not waited, and a question counts how long the QA has let it wait. */
export function tickLive(props: { workspace: IWorkspace; seconds: number }): IWorkspace {
  const { workspace, seconds } = props;
  const { live } = workspace;

  if (!live || live.isDone) return workspace;

  if (live.question !== undefined)
    return {
      ...workspace,
      live: {
        ...live,
        question: { ...live.question, waitedSec: live.question.waitedSec + seconds },
      },
    };

  if (!live.isRunning) return workspace;

  return { ...workspace, live: { ...live, elapsedSec: live.elapsedSec + seconds } };
}
