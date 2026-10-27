/**
 * A suite file's path is /<token>/suite/<project>/<run>/<file…>; one without this
 * launch's token, or one that climbs out, gets nothing.
 */
export function suiteFileOfPath(props: {
  path: string;
  token: string;
}): { projectId: string; runId: string; file: string[] } | null {
  const [, token, route, project, run, ...rest] =
    props.path.split('?')[0]?.split('/') ?? [];
  const projectId = segmentOf(project);
  const runId = segmentOf(run);
  const file = rest.map(segmentOf);

  if (
    token !== props.token ||
    route !== 'suite' ||
    projectId === null ||
    runId === null ||
    file.length === 0 ||
    file.some((segment) => segment === null)
  )
    return null;

  return { projectId, runId, file: file.filter((segment) => segment !== null) };
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
