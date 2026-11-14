import type { BugReportBlock, TemplatePart } from '@/shared/types';
import { fillValues } from './fillValues';

/**
 * O que um modelo monta, na ordem dele: cada seção que tem o que mostrar, sob o título
 * do time, e cada texto com os campos preenchidos, as linhas com "- " como lista.
 */
export function renderParts(props: {
  parts: TemplatePart[];
  sections: Record<string, BugReportBlock[]>;
  values: Record<string, string>;
}): BugReportBlock[] {
  return props.parts.flatMap((part): BugReportBlock[] => {
    if (part.kind === 'section') {
      const blocks = props.sections[part.field] ?? [];
      const heading = fillValues({ text: part.heading, values: props.values }).trim();

      return blocks.length === 0
        ? []
        : [
            ...(heading === '' ? [] : [{ kind: 'heading' as const, text: heading }]),
            ...blocks,
          ];
    }

    return fillValues({ text: part.text, values: props.values })
      .split(/\n\s*\n/)
      .flatMap(blockOf);
  });
}

function blockOf(paragraph: string): BugReportBlock[] {
  const lines = paragraph
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.trim() !== '');

  if (lines.length === 0) return [];

  return lines.every((line) => /^\s*-\s+/.test(line))
    ? [{ kind: 'list', items: lines.map((line) => line.replace(/^\s*-\s+/, '').trim()) }]
    : [{ kind: 'paragraph', text: lines.join('\n').trim() }];
}
