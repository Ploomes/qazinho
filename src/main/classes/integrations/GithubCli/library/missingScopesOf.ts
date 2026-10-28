import { GITHUB_CLI } from '@/main/classes/integrations/GithubCli/constants';

const COVERS: Record<string, string[]> = {
  repo: ['repo'],
  'read:org': ['read:org', 'write:org', 'admin:org'],
};

/**
 * Os escopos de que o QAzinho precisa e que o cabeçalho X-OAuth-Scopes de um token não
 * tem; nenhum quando o GitHub não mandou esse cabeçalho.
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
