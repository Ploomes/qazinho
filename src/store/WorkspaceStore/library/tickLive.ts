import type { IWorkspace } from '@/modules/Workspace';

/** A held run stops counting: the clock says how long the device has been worked, not waited. */
export function tickLive(props: { workspace: IWorkspace; seconds: number }): IWorkspace {
  const { workspace, seconds } = props;
  const { live } = workspace;

  if (!live || !live.isRunning || live.isDone) return workspace;

  return { ...workspace, live: { ...live, elapsedSec: live.elapsedSec + seconds } };
}
