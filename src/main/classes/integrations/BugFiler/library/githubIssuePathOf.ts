/** The API path of a GitHub issue, out of its page's address; null for an address that is no GitHub issue. */
export function githubIssuePathOf(url: string): string | null {
  const found = /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)\/issues\/(\d+)\/?$/.exec(
    url.trim(),
  );

  return found === null
    ? null
    : `repos/${found[1] ?? ''}/${found[2] ?? ''}/issues/${found[3] ?? ''}`;
}
