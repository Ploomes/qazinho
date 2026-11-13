import type { BugReportBlock, IBugReport } from '@/shared/types';

/**
 * O relatório de um bug como Markdown de issue do GitHub: títulos, parágrafos, os passos
 * com o que quebrou em negrito, fatos por rótulo e pedidos que falharam como código.
 */
export function markdownOfReport(report: IBugReport): string {
  return report.blocks.flatMap(markdownOf).join('\n\n');
}

function code(said: string): string {
  const longest = Math.max(0, ...(said.match(/`+/g) ?? []).map((run) => run.length));
  const fence = '`'.repeat(longest + 1);
  const pad = said.startsWith('`') || said.endsWith('`') ? ' ' : '';

  return `${fence}${pad}${said}${pad}${fence}`;
}

function markdownOf(block: BugReportBlock): string[] {
  switch (block.kind) {
    case 'heading':
      return block.text.trim() === '' ? [] : [`### ${block.text.trim()}`];
    case 'code':
      return block.text.trim() === ''
        ? []
        : [['```', block.text.trimEnd(), '```'].join('\n')];
    case 'paragraph':
      return block.text.trim() === '' ? [] : [block.text.trim().replace(/\n/g, '  \n')];
    case 'list':
      return block.items.length === 0
        ? []
        : [block.items.map((item) => `- ${item}`).join('\n')];
    case 'steps':
      return block.items.length === 0
        ? []
        : [
            block.items
              .map(
                (step, index) =>
                  `${String(index + 1)}. ${step.isBad ? `**${step.text}**` : step.text}`,
              )
              .join('\n'),
          ];
    case 'facts':
      return block.items.length === 0
        ? []
        : [
            block.items
              .map(
                (fact) =>
                  `- **${fact.label}:** ${fact.url === null ? fact.value : `[${fact.value}](${fact.url})`}`,
              )
              .join('\n'),
          ];
    case 'table': {
      const row = (cells: string[]) =>
        `| ${cells.map((said) => said.replace(/\|/g, '\\|').replace(/\n/g, ' ')).join(' | ')} |`;

      return block.rows.length === 0
        ? []
        : [
            [
              row(block.head),
              row(block.head.map(() => '---')),
              ...block.rows.map(row),
            ].join('\n'),
          ];
    }
    case 'requests':
      return block.items.length === 0
        ? []
        : [
            block.items
              .map(
                (request) =>
                  `- ${code(request.call)} ${request.outcome}${request.answer === undefined ? '' : `\n  ${code(request.answer)}`}`,
              )
              .join('\n'),
          ];
  }
}
