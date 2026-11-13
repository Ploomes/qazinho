import type { ITemplate } from '@/shared/types';
import { renderParts, textOfBlocks } from '@/modules/Template/library';

/**
 * A abertura e o fecho do comentário das dúvidas pelo modelo do time: o que vem antes da
 * lista das dúvidas e o que vem depois.
 */
export function doubtsTextsOf(props: {
  template: ITemplate;
  values: Record<string, string>;
}): { intro: string; closing: string } {
  const at = props.template.parts.findIndex(
    (part) => part.kind === 'section' && part.field === 'doubts',
  );
  const before = at === -1 ? props.template.parts : props.template.parts.slice(0, at);
  const after = at === -1 ? [] : props.template.parts.slice(at + 1);
  const textOf = (parts: ITemplate['parts']) =>
    textOfBlocks(renderParts({ parts, sections: {}, values: props.values }));

  return { intro: textOf(before), closing: textOf(after) };
}
