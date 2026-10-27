const GITHUB_REMOTE =
  /^(?:git@github\.com:|ssh:\/\/git@github\.com\/|https:\/\/(?:[^@/\s]+@)?github\.com\/)([^/\s]+)\/([^/\s]+?)(?:\.git)?\/?$/i;

/**
 * The GitHub repository a git remote points at, as owner/name; null for a remote anywhere
 * else.
 */
export function repositoryOfRemote(url: string): string | null {
  const match = GITHUB_REMOTE.exec(url.trim());

  return match === null ? null : `${match[1] ?? ''}/${match[2] ?? ''}`;
}
