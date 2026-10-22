import type { IDiffLine } from '@/modules/Automation/types';

const HUNK = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/;

/** The lines of a file's unified diff as the review shows them, each numbered before and after; git's own header lines are left out. */
export function diffLinesOf(patch: string): IDiffLine[] {
  const lines: IDiffLine[] = [];
  let old = 0;
  let next = 0;
  let isInHunk = false;

  for (const [index, line] of patch.split('\n').entries()) {
    const hunk = HUNK.exec(line);
    const key = String(index);

    if (hunk !== null) {
      old = Number(hunk[1]);
      next = Number(hunk[2]);
      isInHunk = true;
      lines.push({ key, kind: 'hunk', text: line, old: null, new: null });
    } else if (!isInHunk || line.startsWith('\\')) {
      continue;
    } else if (line.startsWith('+')) {
      lines.push({ key, kind: 'add', text: line.slice(1), old: null, new: next });
      next += 1;
    } else if (line.startsWith('-')) {
      lines.push({ key, kind: 'del', text: line.slice(1), old, new: null });
      old += 1;
    } else {
      lines.push({ key, kind: 'same', text: line.slice(1), old, new: next });
      old += 1;
      next += 1;
    }
  }

  return lines;
}
