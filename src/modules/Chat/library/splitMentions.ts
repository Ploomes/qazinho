/**
 * Uma mensagem cortada em texto simples e nas menções dela, para as menções se
 * destacarem.
 */
export function splitMentions(props: {
  text: string;
  ids: string[];
}): { text: string; isMention: boolean }[] {
  if (props.ids.length === 0) return [{ text: props.text, isMention: false }];

  const tokens = new Set(props.ids.map((id) => `@${id}`));
  const escaped = props.ids.map((id) => id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(@(?:${escaped.join('|')}))(?![\\w-])`);

  return props.text
    .split(pattern)
    .filter((part) => part.length > 0)
    .map((part) => ({ text: part, isMention: tokens.has(part) }));
}
