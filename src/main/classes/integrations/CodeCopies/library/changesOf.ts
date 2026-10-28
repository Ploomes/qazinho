import type { ICodeChange } from '@/shared/types';

/**
 * Os arquivos que uma comparação mudou e quantos commits ela guarda, como o gh os
 * imprimiu pelo filtro de comparação; null quando não imprimiu.
 */
export function changesOf(
  text: string,
): { changes: ICodeChange[]; commits: number } | null {
  let read: unknown;

  try {
    read = JSON.parse(text);
  } catch {
    return null;
  }

  if (typeof read !== 'object' || read === null) return null;

  const { commits, files } = read as { commits?: unknown; files?: unknown };

  if (!Array.isArray(files)) return null;

  return {
    commits: typeof commits === 'number' ? commits : 0,
    changes: files.flatMap((file: unknown) => {
      if (typeof file !== 'object' || file === null) return [];

      const { path, status, additions, deletions } = file as Record<string, unknown>;

      return typeof path === 'string'
        ? [
            {
              path,
              status: typeof status === 'string' ? status : 'modified',
              additions: typeof additions === 'number' ? additions : 0,
              deletions: typeof deletions === 'number' ? deletions : 0,
            },
          ]
        : [];
    }),
  };
}
