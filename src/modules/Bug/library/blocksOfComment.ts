import type { BugReportBlock } from '@/shared/types';

const ITEM = /^\s*[-*•]\s+/;

/** A comment as plain text read into a report's blocks: paragraphs split by a blank line, and a run of lines that start with a dash as a list. */
export function blocksOfComment(text: string): BugReportBlock[] {
  return text
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((chunk) => chunk.split('\n').filter((line) => line.trim() !== ''))
    .filter((lines) => lines.length > 0)
    .map((lines): BugReportBlock =>
      lines.every((line) => ITEM.test(line))
        ? { kind: 'list', items: lines.map((line) => line.replace(ITEM, '').trim()) }
        : { kind: 'paragraph', text: lines.map((line) => line.trim()).join('\n') },
    );
}
