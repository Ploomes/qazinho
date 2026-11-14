import type { IAdfNode } from '@/main/classes/integrations/JiraApi/types';

/**
 * O comentário das dúvidas como documento da Atlassian: o autor da história mencionado na
 * abertura, uma dúvida por item com o id em negrito, e o fecho.
 */
export function adfOfDoubts(props: {
  intro: string;
  doubts: { id: string; question: string }[];
  closing: string;
  mention: { id: string; name: string } | null;
}): IAdfNode {
  const intro = props.intro.trim();
  const closing = props.closing.trim();
  const opening: IAdfNode[] = [
    ...(props.mention === null
      ? []
      : [
          {
            type: 'mention',
            attrs: { id: props.mention.id, text: `@${props.mention.name}` },
          },
        ]),
    ...(intro === ''
      ? []
      : [{ type: 'text', text: props.mention === null ? intro : ` ${intro}` }]),
  ];

  return {
    type: 'doc',
    version: 1,
    content: [
      ...(opening.length === 0 ? [] : [{ type: 'paragraph', content: opening }]),
      {
        type: 'bulletList',
        content: props.doubts.map(({ id, question }) => ({
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: id, marks: [{ type: 'strong' }] },
                { type: 'text', text: ` ${question.trim()}` },
              ],
            },
          ],
        })),
      },
      ...(closing === ''
        ? []
        : [{ type: 'paragraph', content: [{ type: 'text', text: closing }] }]),
    ],
  };
}
