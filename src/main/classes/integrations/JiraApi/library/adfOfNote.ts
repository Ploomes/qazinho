import type { IAdfNode } from '@/main/classes/integrations/JiraApi/types';

/**
 * Um comentário que o QA escreveu como documento da Atlassian: um parágrafo por bloco, e
 * as linhas que começam com "- " como uma lista.
 */
export function adfOfNote(text: string): IAdfNode {
  return {
    type: 'doc',
    version: 1,
    content: text
      .split(/\n{2,}/)
      .map((block) => block.split('\n').filter((line) => line.trim() !== ''))
      .filter((lines) => lines.length > 0)
      .flatMap(blockOf),
  };
}

function blockOf(lines: string[]): IAdfNode[] {
  const items = lines.filter((line) => /^\s*-\s+/.test(line));
  const prose = lines.filter((line) => !/^\s*-\s+/.test(line));

  return [
    ...(prose.length === 0
      ? []
      : [
          {
            type: 'paragraph',
            content: prose.flatMap((line, index) => [
              ...(index === 0 ? [] : [{ type: 'hardBreak' }]),
              { type: 'text', text: line.trim() },
            ]),
          },
        ]),
    ...(items.length === 0
      ? []
      : [
          {
            type: 'bulletList',
            content: items.map((line) => ({
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: line.replace(/^\s*-\s+/, '').trim() }],
                },
              ],
            })),
          },
        ]),
  ];
}
