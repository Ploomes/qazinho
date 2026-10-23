import type { IAdfNode } from '@/main/classes/integrations/JiraApi/types';
import type { BugReportBlock, IBugReport } from '@/shared/types';

function text(props: { text: string; marks?: IAdfNode['marks'] }): IAdfNode[] {
  return props.text === ''
    ? []
    : [
        props.marks === undefined
          ? { type: 'text', text: props.text }
          : { type: 'text', text: props.text, marks: props.marks },
      ];
}

function paragraph(content: IAdfNode[]): IAdfNode {
  return { type: 'paragraph', content };
}

function lines(said: string): IAdfNode[] {
  return said
    .split('\n')
    .flatMap((line, index) => [
      ...(index === 0 ? [] : [{ type: 'hardBreak' }]),
      ...text({ text: line }),
    ]);
}

function list(props: { type: string; items: IAdfNode[][] }): IAdfNode[] {
  const items = props.items.filter((content) => content.length > 0);

  return items.length === 0
    ? []
    : [
        {
          type: props.type,
          content: items.map((content) => ({
            type: 'listItem',
            content: [paragraph(content)],
          })),
        },
      ];
}

function cell(props: { type: string; said: string }): IAdfNode {
  return { type: props.type, attrs: {}, content: [paragraph(lines(props.said))] };
}

function nodesOf(block: BugReportBlock): IAdfNode[] {
  switch (block.kind) {
    case 'heading':
      return block.text.trim() === ''
        ? []
        : [{ type: 'heading', attrs: { level: 3 }, content: text({ text: block.text }) }];
    case 'paragraph':
      return block.text.trim() === '' ? [] : [paragraph(lines(block.text))];
    case 'list':
      return list({
        type: 'bulletList',
        items: block.items.map((item) => text({ text: item })),
      });
    case 'steps':
      return list({
        type: 'orderedList',
        items: block.items.map((step) =>
          text({
            text: step.text,
            ...(step.isBad ? { marks: [{ type: 'strong' }] } : {}),
          }),
        ),
      });
    case 'facts':
      return list({
        type: 'bulletList',
        items: block.items.map((fact) => [
          ...text({ text: `${fact.label}: `, marks: [{ type: 'strong' }] }),
          ...text({
            text: fact.value,
            ...(fact.url === null
              ? {}
              : { marks: [{ type: 'link', attrs: { href: fact.url } }] }),
          }),
        ]),
      });
    case 'table':
      return block.rows.length === 0
        ? []
        : [
            {
              type: 'table',
              attrs: { isNumberColumnEnabled: false, layout: 'default' },
              content: [
                {
                  type: 'tableRow',
                  content: block.head.map((said) => cell({ type: 'tableHeader', said })),
                },
                ...block.rows.map((row) => ({
                  type: 'tableRow',
                  content: row.map((said) => cell({ type: 'tableCell', said })),
                })),
              ],
            },
          ];
    case 'requests':
      return list({
        type: 'bulletList',
        items: block.items.map((request) => [
          ...text({ text: request.call, marks: [{ type: 'code' }] }),
          ...text({ text: ` ${request.outcome}` }),
          ...(request.answer === undefined
            ? []
            : [
                ...text({ text: ' — ' }),
                ...text({ text: request.answer, marks: [{ type: 'code' }] }),
              ]),
        ]),
      });
  }
}

/** A bug's report or a plan as an Atlassian document: headings, paragraphs, the steps in order with the one that broke in bold, facts by label, the failed requests as code, and tables. */
export function adfOfReport(report: IBugReport): IAdfNode {
  return { type: 'doc', version: 1, content: report.blocks.flatMap(nodesOf) };
}
