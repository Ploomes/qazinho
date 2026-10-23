import type { IConfluenceSpace } from '@/shared/types';

/** The spaces Confluence listed, each with its id, key and name, by name. */
export function confluenceSpacesOf(answer: unknown): IConfluenceSpace[] {
  const results = (answer as { results?: unknown } | null)?.results;

  return Array.isArray(results)
    ? (results as { id?: unknown; key?: unknown; name?: unknown }[])
        .flatMap(({ id, key, name }) =>
          typeof id === 'string' && typeof key === 'string'
            ? [{ id, key, name: typeof name === 'string' ? name : key }]
            : [],
        )
        .sort((one, other) => one.name.localeCompare(other.name))
    : [];
}
