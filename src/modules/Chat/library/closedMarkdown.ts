const FENCE = /^ {0,3}```/gm;

/**
 * Markdown que ainda chega, fechado onde o texto parou: um negrito ou um código aberto
 * aparece formatado desde o começo, e não como asteriscos até o fim dele.
 */
export function closedMarkdown(text: string): string {
  if ((text.match(FENCE)?.length ?? 0) % 2 === 1) return `${text}\n\`\`\``;

  const outsideCode = text.replace(/```[\s\S]*?```/g, '');
  const ticks = outsideCode.match(/`/g)?.length ?? 0;
  const inCode = ticks % 2 === 1;

  if (inCode) return `${text}\``;

  const stars = outsideCode.replace(/`[^`]*`/g, '').match(/\*\*/g)?.length ?? 0;

  if (stars % 2 === 0) return text;

  return text.endsWith('**') ? text.slice(0, -2) : `${text.trimEnd()}**`;
}
