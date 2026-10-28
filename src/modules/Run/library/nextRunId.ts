import type { IWorkspace } from '@/modules/Workspace';

/**
 * O id da próxima run do workspace: um acima de toda run que o histórico ou o chat dele
 * nomeou, para uma run que nunca andou um passo não ser nomeada duas vezes.
 */
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

function numberOf(id: string | null): number {
  return Number(/^r-(\d+)$/.exec(id ?? '')?.[1] ?? 0);
}
