const LONGEST = 60;

/**
 * O nome de um plano pelo que o QA pediu primeiro: a primeira linha, com maiúscula, sem o
 * ponto final, cortada numa palavra; vazio quando ele não escreveu nada.
 */
export function planNameOf(text: string): string {
  const line = (text.trim().split('\n')[0] ?? '')
    .replace(/\s+/g, ' ')
    .replace(/[.!;:]+$/, '');
  const cut =
    line.length <= LONGEST
      ? line
      : `${line.slice(0, line.lastIndexOf(' ', LONGEST) > 0 ? line.lastIndexOf(' ', LONGEST) : LONGEST)}…`;

  return cut.charAt(0).toUpperCase() + cut.slice(1);
}
