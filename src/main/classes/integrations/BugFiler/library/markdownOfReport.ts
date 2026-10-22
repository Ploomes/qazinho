import type { BugReportBlock, IBugReport } from '@/shared/types';

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
    case 'paragraph':
      return block.text.trim() === '' ? [] : [block.text.trim().replace(/\n/g, '  \n')];
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
    case 'requests':
      return block.items.length === 0
        ? []
        : [
            block.items
              .map((request) => `- ${code(request.call)} ${request.outcome}`)
              .join('\n'),
          ];
  }
}

/** A bug's report as the Markdown a GitHub issue reads: headings, paragraphs, the steps in order with the one that broke in bold, facts by label and the failed requests as code. */
export function markdownOfReport(report: IBugReport): string {
  return report.blocks.flatMap(markdownOf).join('\n\n');
}
