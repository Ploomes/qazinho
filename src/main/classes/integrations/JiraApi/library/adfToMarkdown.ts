import type { IAdfNode } from '@/main/classes/integrations/JiraApi/types';

/**
 * A Jira document as markdown the agent reads: headings, lists and checklists, tables,
 * code, quotes and links kept; a plain string as it is.
 */
export function adfToMarkdown(document: unknown): string {
  if (typeof document === 'string') return document.trim();

  if (typeof document !== 'object' || document === null) return '';

  return block(document).trim();
}

function attr(props: { node: IAdfNode; name: string }): string {
  const value = props.node.attrs?.[props.name];

  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

function marked(node: IAdfNode): string {
  let text = node.text ?? '';

  for (const mark of node.marks ?? []) {
    if (mark.type === 'strong') text = `**${text}**`;
    else if (mark.type === 'em') text = `_${text}_`;
    else if (mark.type === 'code') text = `\`${text}\``;
    else if (mark.type === 'strike') text = `~~${text}~~`;
    else if (mark.type === 'link' && typeof mark.attrs?.href === 'string')
      text = `[${text}](${mark.attrs.href})`;
  }

  return text;
}

function inline(nodes: IAdfNode[] | undefined): string {
  return (nodes ?? [])
    .map((node): string => {
      if (node.type === 'text') return marked(node);
      if (node.type === 'hardBreak') return '\n';
      if (
        node.type === 'mention' ||
        node.type === 'placeholder' ||
        node.type === 'status'
      )
        return attr({ node, name: 'text' });
      if (node.type === 'emoji')
        return attr({ node, name: 'text' }) || attr({ node, name: 'shortName' });
      if (node.type === 'inlineCard') return attr({ node, name: 'url' });
      if (node.type === 'mediaInline')
        return `[${attr({ node, name: 'alt' }) || 'file'}]`;
      if (node.type === 'date') {
        const at = Number(attr({ node, name: 'timestamp' }));

        return at > 0 ? new Date(at).toISOString().slice(0, 10) : '';
      }

      return inline(node.content) || attr({ node, name: 'text' });
    })
    .join('');
}

function prefixed(props: { text: string; first: string; rest: string }): string {
  return props.text
    .split('\n')
    .map((line, index) => (index === 0 ? props.first : props.rest) + line)
    .join('\n');
}

function listed(node: IAdfNode): string {
  const start = Number(attr({ node, name: 'order' })) || 1;

  return (node.content ?? [])
    .map((item, index) => {
      const mark =
        node.type === 'orderedList'
          ? `${String(start + index)}. `
          : item.type === 'taskItem'
            ? attr({ node: item, name: 'state' }) === 'DONE'
              ? '- [x] '
              : '- [ ] '
            : '- ';
      const body =
        item.type === 'taskItem' || item.type === 'decisionItem'
          ? inline(item.content)
          : blocks({ nodes: item.content, gap: '\n' });

      return prefixed({ text: body.trim(), first: mark, rest: ' '.repeat(mark.length) });
    })
    .join('\n');
}

function table(node: IAdfNode): string {
  const rows = (node.content ?? []).map((row) =>
    (row.content ?? []).map((cell) =>
      blocks({ nodes: cell.content, gap: ' ' })
        .replace(/\s*\n\s*/g, ' ')
        .replace(/\|/g, '\\|')
        .trim(),
    ),
  );
  const [head, ...body] = rows;

  if (head === undefined) return '';

  return [
    `| ${head.join(' | ')} |`,
    `| ${head.map(() => '---').join(' | ')} |`,
    ...body.map((cells) => `| ${cells.join(' | ')} |`),
  ].join('\n');
}

function block(node: IAdfNode): string {
  switch (node.type) {
    case 'paragraph':
      return inline(node.content);
    case 'heading': {
      const level = Math.min(Math.max(Number(attr({ node, name: 'level' })) || 1, 1), 6);

      return `${'#'.repeat(level)} ${inline(node.content)}`;
    }
    case 'bulletList':
    case 'orderedList':
    case 'taskList':
    case 'decisionList':
      return listed(node);
    case 'blockquote':
    case 'panel':
      return prefixed({ text: blocks({ nodes: node.content }), first: '> ', rest: '> ' });
    case 'codeBlock':
      return `\`\`\`${attr({ node, name: 'language' })}\n${inline(node.content)}\n\`\`\``;
    case 'rule':
      return '---';
    case 'table':
      return table(node);
    case 'media':
      return `[${attr({ node, name: 'alt' }) || 'image'}]`;
    case 'blockCard':
    case 'embedCard':
      return attr({ node, name: 'url' });
    case 'expand':
    case 'nestedExpand': {
      const title = attr({ node, name: 'title' });
      const body = blocks({ nodes: node.content });

      return title.length === 0 ? body : `**${title}**\n\n${body}`;
    }
    default:
      return node.content === undefined
        ? inline([node])
        : blocks({ nodes: node.content });
  }
}

function blocks(props: { nodes: IAdfNode[] | undefined; gap?: string }): string {
  return (props.nodes ?? [])
    .map(block)
    .filter((text) => text.trim().length > 0)
    .join(props.gap ?? '\n\n');
}
