import type { DeviceState } from '@/modules/Device/types';
import type { IWorkspace } from '@/modules/Workspace';

/** The device is only up while a run is: nothing boots for a plan nobody asked to run, and it holds while paused or while its agent waits on the QA. */
export function deviceStateOf(workspace: IWorkspace | null): DeviceState {
  if (!workspace?.live) return 'off';
  if (workspace.live.isDone) return 'stopped';

  return workspace.live.isRunning && workspace.live.question === undefined
    ? 'driving'
    : 'holding';
}
