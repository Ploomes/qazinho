import type { IWorkspace } from '@/modules/Workspace/types';

export function startRun(props: {
  workspace: IWorkspace;
  startedAt: string;
}): IWorkspace {
  const { workspace, startedAt } = props;

  if (workspace.plan.length === 0) return workspace;

  return {
    ...workspace,
    status: 'running',
    live: {
      id: `r-${String(workspace.runs.length + 1).padStart(2, '0')}`,
      stepIndex: 0,
      isRunning: true,
      isDone: false,
      elapsedSec: 0,
      ticks: 0,
      startedAt,
      verdicts: [],
    },
  };
}
