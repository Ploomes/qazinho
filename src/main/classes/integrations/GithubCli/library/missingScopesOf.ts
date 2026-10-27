import { GITHUB_CLI } from '@/main/classes/integrations/GithubCli/constants';

const COVERS: Record<string, string[]> = {
  repo: ['repo'],
  'read:org': ['read:org', 'write:org', 'admin:org'],
};

/**
 * The scopes QAzinho needs that a token's X-OAuth-Scopes header lacks; none when GitHub
 * sent no such header.
 */
export function missingScopesOf(header: string | undefined): string[] {
  if (header === undefined) return [];

  const granted = header
    .split(',')
    .map((scope) => scope.trim())
    .filter((scope) => scope !== '');

  return GITHUB_CLI.scopes.filter(
    (needed) => !(COVERS[needed] ?? [needed]).some((scope) => granted.includes(scope)),
  );
}
