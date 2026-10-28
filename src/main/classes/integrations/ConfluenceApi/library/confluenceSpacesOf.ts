import type { IConfluenceSpace } from '@/shared/types';

/** Os espaços que o Confluence listou, cada um com o id, a chave e o nome, pelo nome. */
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
