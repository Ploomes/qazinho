import type { IRunRef } from '@/shared/types';

/**
 * A replay path is /<token>/<workspace>/<run>; a request without this launch's token, or
 * one that climbs out, gets nothing.
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
