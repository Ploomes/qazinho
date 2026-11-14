import type { IAdfNode } from '@/main/classes/integrations/JiraApi/types';

/** Um documento da Atlassian com uma pessoa mencionada no começo do primeiro parágrafo. */
export function adfWithMention(props: {
  doc: IAdfNode;
  mention: { id: string; name: string } | null;
}): IAdfNode {
  const { doc, mention } = props;

  if (mention === null) return doc;

  const tag: IAdfNode = {
    type: 'mention',
    attrs: { id: mention.id, text: `@${mention.name}` },
  };
  const [first, ...rest] = doc.content ?? [];

  return {
    ...doc,
    content:
      first?.type === 'paragraph'
        ? [
            {
              ...first,
              content: [tag, { type: 'text', text: ' ' }, ...(first.content ?? [])],
            },
            ...rest,
          ]
        : [{ type: 'paragraph', content: [tag] }, ...(doc.content ?? [])],
  };
}
