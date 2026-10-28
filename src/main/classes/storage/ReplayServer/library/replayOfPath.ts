import type { IRunRef } from '@/shared/types';

/**
 * Um caminho de replay é /<token>/<workspace>/<run>; um pedido sem o token desta
 * execução, ou um que sobe para fora, não recebe nada.
 */
export function replayOfPath(props: { path: string; token: string }): IRunRef | null {
  const [, token, workspace, run, ...rest] = props.path.split('?')[0]?.split('/') ?? [];
  const workspaceId = segmentOf(workspace);
  const runId = segmentOf(run);

  if (token !== props.token || workspaceId === null || runId === null || rest.length > 0)
    return null;

  return { workspaceId, runId };
}

function segmentOf(part: string | undefined): string | null {
  if (!part) return null;

  try {
    const segment = decodeURIComponent(part);

    return segment === '.' || segment === '..' || /[\\/]/.test(segment) ? null : segment;
  } catch {
    return null;
  }
}
