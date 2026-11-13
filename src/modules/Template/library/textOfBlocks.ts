import type { BugReportBlock } from '@/shared/types';

/** Blocos montados como o texto que o QA edita antes de postar um comentário. */
export function textOfBlocks(blocks: BugReportBlock[]): string {
  return blocks
    .flatMap((block): string[] => {
      switch (block.kind) {
        case 'heading':
        case 'paragraph':
        case 'code':
          return [block.text];
        case 'list':
          return [block.items.map((item) => `- ${item}`).join('\n')];
        case 'steps':
          return [
            block.items
              .map((item, index) => `${String(index + 1)}. ${item.text}`)
              .join('\n'),
          ];
        case 'facts':
          return [
            block.items.map(({ label, value }) => `- ${label}: ${value}`).join('\n'),
          ];
        case 'requests':
          return [
            block.items.map(({ call, outcome }) => `- ${call} · ${outcome}`).join('\n'),
          ];
        case 'table':
          return [block.rows.map((row) => `- ${row.join(' · ')}`).join('\n')];
      }
    })
    .filter((text) => text.trim() !== '')
    .join('\n\n');
}
