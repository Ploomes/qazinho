import type { IJiraStatus } from '@/shared/types';

const ORDER: IJiraStatus['category'][] = ['new', 'indeterminate', 'done', ''];

/**
 * Os status que o Jira lista, cada nome uma vez, na ordem do trabalho: os por fazer, os
 * em andamento e os feitos.
 */
export function jiraStatusesOf(body: unknown): IJiraStatus[] {
  const seen = new Set<string>();

  return (Array.isArray(body) ? body : [])
    .flatMap((value): IJiraStatus[] => {
      const { name, statusCategory } = (value ?? {}) as {
        name?: unknown;
        statusCategory?: { key?: unknown };
      };
      const named = typeof name === 'string' ? name.trim() : '';
      const key = statusCategory?.key;

      if (named === '' || seen.has(named.toLowerCase())) return [];

      seen.add(named.toLowerCase());

      return [
        {
          name: named,
          category: key === 'new' || key === 'indeterminate' || key === 'done' ? key : '',
        },
      ];
    })
    .sort((one, other) => ORDER.indexOf(one.category) - ORDER.indexOf(other.category));
}
