import type { DeviceState } from '@/modules/Device/types';
import type { IWorkspace } from '@/modules/Workspace';

/**
 * O dispositivo só está de pé enquanto uma run está: nada sobe para um plano que ninguém
 * pediu para rodar, e ele segura enquanto pausado ou enquanto o agente espera pelo QA.
 */
export function deviceStateOf(workspace: IWorkspace | null): DeviceState {
  if (!workspace?.live) return 'off';
  if (workspace.live.isDone) return 'stopped';

  return workspace.live.isRunning && workspace.live.question === undefined
    ? 'driving'
    : 'holding';
}
