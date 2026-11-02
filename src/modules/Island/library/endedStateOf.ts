import type { IWorkspace } from '@/modules/Workspace';
import type { IslandState } from '@/shared/types';

/** O fim de uma run para a ilha: os passos que passaram e os que falharam. */
export function endedStateOf(workspace: IWorkspace): IslandState {
  const outcomes = workspace.live?.outcomes ?? [];

  return {
    kind: 'ended',
    workspaceId: workspace.id,
    name: workspace.name,
    passed: outcomes.filter(({ verdict }) => verdict === 'passed').length,
    failed: outcomes.filter(({ verdict }) => verdict === 'failed').length,
  };
}
