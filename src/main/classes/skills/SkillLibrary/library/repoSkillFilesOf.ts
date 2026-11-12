import { SKILL_LIBRARY } from '@/main/classes/skills/SkillLibrary/constants';

type Loose = Record<string, unknown>;

/**
 * As skills de uma pasta num repositório, a partir da árvore que o GitHub devolve: cada
 * pasta com um SKILL.md, com os arquivos dela que cabem, pelo caminho e pelo blob.
 */
export function repoSkillFilesOf(props: {
  tree: unknown;
  folder: string;
}): { name: string; files: { path: string; sha: string }[] }[] {
  const prefix = `${props.folder.replace(/^\/+|\/+$/g, '')}/`;
  const entries = listOf((recordOf(props.tree) ?? {}).tree).flatMap((entry) => {
    const one = recordOf(entry);
    const path = typeof one?.path === 'string' ? one.path : '';
    const sha = typeof one?.sha === 'string' ? one.sha : '';
    const size = typeof one?.size === 'number' ? one.size : 0;

    return one?.type === 'blob' &&
      path.startsWith(prefix) &&
      size <= SKILL_LIBRARY.fileMax
      ? [{ path: path.slice(prefix.length), sha }]
      : [];
  });
  const names = [
    ...new Set(
      entries
        .filter(({ path }) => path.split('/').length === 2)
        .filter(({ path }) => path.endsWith(`/${SKILL_LIBRARY.skillFile}`))
        .map(({ path }) => path.split('/')[0] ?? ''),
    ),
  ].filter((name) => name !== '');

  return names.slice(0, SKILL_LIBRARY.skillsMax).map((name) => ({
    name,
    files: entries
      .filter(({ path }) => path.startsWith(`${name}/`))
      .slice(0, SKILL_LIBRARY.filesMax + 1)
      .map(({ path, sha }) => ({ path: path.slice(name.length + 1), sha })),
  }));
}

function recordOf(value: unknown): Loose | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Loose)
    : null;
}

function listOf(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}
