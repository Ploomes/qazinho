import type { IJiraProject } from '@/shared/types';

/**
 * The projects of a Jira answer, a plain list or a page of them, with their keys and
 * names.
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
