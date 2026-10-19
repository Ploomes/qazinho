import type { IWorkspace } from '@/modules/Workspace';

function numberOf(id: string | null): number {
  return Number(/^r-(\d+)$/.exec(id ?? '')?.[1] ?? 0);
}

/** The id of the workspace's next run: one past every run its history or its chat named, so a run that never walked a step is not named twice. */
export function nextRunId(workspace: Pick<IWorkspace, 'runs' | 'chat'>): string {
  const highest = Math.max(
    0,
    ...workspace.runs.map(({ id }) => numberOf(id)),
    ...workspace.chat.map((message) =>
      numberOf('runId' in message ? message.runId : null),
    ),
  );

  return `r-${String(highest + 1).padStart(2, '0')}`;
}
