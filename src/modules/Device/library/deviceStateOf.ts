import type { DeviceState } from '@/modules/Device/types';
import type { IWorkspace } from '@/modules/Workspace/types';

/** The device is only up while a run is: nothing boots for a plan nobody asked to run. */
export function deviceStateOf(workspace: IWorkspace | null): DeviceState {
  if (!workspace?.live) return 'off';
  if (workspace.live.isDone) return 'stopped';

  return workspace.live.isRunning ? 'driving' : 'holding';
}
