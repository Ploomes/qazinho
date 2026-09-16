import type { IWorkspace } from '@/modules/Workspace/types';

/** The QA stopped the run: it ends now, and nothing the machine sends afterwards is filed as a run. */
export function stopRun(workspace: IWorkspace): IWorkspace {
  const { live } = workspace;

  if (!live || live.isDone) return workspace;

  return {
    ...workspace,
    status: 'stopped',
    live: { ...live, isRunning: false, isDone: true, doingIndex: -1, streamUrl: null },
  };
}
