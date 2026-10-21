import type { ICodeChange } from '@/shared/types';

/** The files a comparison changed and how many commits it holds, as gh printed them through the compare filter; null when it did not. */
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
