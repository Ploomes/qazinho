import type { IJiraBoard } from '@/shared/types';

/** Os boards que a API ágil do Jira lista, com o projeto de cada um. */
export function jiraBoardsOf(body: unknown): IJiraBoard[] {
  const { values } = (body ?? {}) as { values?: unknown };

  return (Array.isArray(values) ? values : []).flatMap((value): IJiraBoard[] => {
    const { id, name, location } = (value ?? {}) as {
      id?: unknown;
      name?: unknown;
      location?: { projectKey?: unknown; displayName?: unknown };
    };

    if (typeof id !== 'number' || typeof name !== 'string' || name.trim() === '')
      return [];

    const project = location?.projectKey ?? location?.displayName;

    return [
      { id, name: name.trim(), project: typeof project === 'string' ? project : '' },
    ];
  });
}
