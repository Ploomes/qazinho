import type { IJiraProject } from '@/shared/types';

/**
 * Os projetos de uma resposta do Jira, uma lista simples ou uma página deles, com as
 * chaves e os nomes.
 */
export function jiraProjectsOf(body: unknown): IJiraProject[] {
  const values = Array.isArray(body)
    ? body
    : (body as { values?: unknown } | null)?.values;

  return (Array.isArray(values) ? values : []).flatMap((project) => {
    const { key, name } = (project ?? {}) as Record<string, unknown>;

    return typeof key === 'string' && key !== ''
      ? [{ key, name: typeof name === 'string' && name !== '' ? name : key }]
      : [];
  });
}
