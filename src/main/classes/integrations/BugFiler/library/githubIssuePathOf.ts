/**
 * O caminho de API de uma issue do GitHub, a partir do endereço da página dela; null para
 * um endereço que não é de issue do GitHub.
 */
export function githubIssuePathOf(url: string): string | null {
  const found = /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)\/issues\/(\d+)\/?$/.exec(
    url.trim(),
  );

  return found === null
    ? null
    : `repos/${found[1] ?? ''}/${found[2] ?? ''}/issues/${found[3] ?? ''}`;
}
