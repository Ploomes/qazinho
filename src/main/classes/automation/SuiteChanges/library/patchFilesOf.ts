import type { ISuiteChangeFile, SuiteFileStatus } from '@/shared/types';

const PATCH_CHARS = 100_000;

/**
 * Each file of a unified diff from git, with what was done to it and the lines it gained
 * and lost, in the order git wrote them.
 */
export function patchFilesOf(diff: string): ISuiteChangeFile[] {
  return diff
    .split(/^(?=diff --git )/m)
    .filter((chunk) => chunk.startsWith('diff --git '))
    .map((chunk) => {
      const lines = chunk.replace(/\n$/, '').split('\n');
      const hunk = lines.findIndex((line) => line.startsWith('@@'));
      const body = hunk === -1 ? [] : lines.slice(hunk);
      const patch = lines.join('\n');

      return {
        path: pathOf(lines),
        status: statusOf(lines),
        additions: body.filter((line) => line.startsWith('+')).length,
        deletions: body.filter((line) => line.startsWith('-')).length,
        patch: patch.length > PATCH_CHARS ? patch.slice(0, PATCH_CHARS) : patch,
      };
    })
    .filter(({ path }) => path !== '');
}

function pathOf(lines: string[]): string {
  const renamed = lines.find((line) => line.startsWith('rename to '));

  if (renamed !== undefined) return renamed.slice('rename to '.length);

  const added = lines.find((line) => line.startsWith('+++ b/'));

  if (added !== undefined) return added.slice('+++ b/'.length);

  const removed = lines.find((line) => line.startsWith('--- a/'));

  return removed === undefined ? '' : removed.slice('--- a/'.length);
}

function statusOf(lines: string[]): SuiteFileStatus {
  if (lines.some((line) => line.startsWith('new file mode'))) return 'added';

  if (lines.some((line) => line.startsWith('deleted file mode'))) return 'deleted';

  return lines.some((line) => line.startsWith('rename to ')) ? 'renamed' : 'modified';
}
