const LONGEST = 60;

/**
 * O nome de um plano pelo que o QA pediu primeiro: a primeira linha, ou o que vem antes
 * dos dois-pontos quando ela é longa, cortada numa palavra e com maiúscula.
 */
export function planNameOf(text: string): string {
  const line = (text.trim().split('\n')[0] ?? '').replace(/\s+/g, ' ');
  const head = line.split(':')[0]?.trim() ?? '';
  const name = line.length > LONGEST && head.length >= 3 ? head : line;
  const cut = name.length <= LONGEST ? name : name.slice(0, lastSpaceOf(name));
  const clean = cut.replace(/[\s.!;:,…-]+$/, '');

  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function lastSpaceOf(name: string): number {
  const space = name.lastIndexOf(' ', LONGEST);

  return space > 0 ? space : LONGEST;
}
