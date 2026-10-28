const GITHUB_REMOTE =
  /^(?:git@github\.com:|ssh:\/\/git@github\.com\/|https:\/\/(?:[^@/\s]+@)?github\.com\/)([^/\s]+)\/([^/\s]+?)(?:\.git)?\/?$/i;

/**
 * O repositório do GitHub para o qual um remoto git aponta, como owner/name; null para um
 * remoto em qualquer outro lugar.
 */
export function repositoryOfRemote(url: string): string | null {
  const match = GITHUB_REMOTE.exec(url.trim());

  return match === null ? null : `${match[1] ?? ''}/${match[2] ?? ''}`;
}
