const FORBIDDEN = new Set(['/', '\\', ':', '*', '?', '"', '<', '>', '|']);
const FIRST_PRINTABLE = 32;
const LONGEST = 120;

/**
 * Um nome de arquivo que o QA consegue ler, a partir de um rótulo: o que nenhum sistema
 * de arquivos aceita vira espaço.
 */
export function fileNameOf(label: string): string {
  const name = [...label]
    .map((char) =>
      FORBIDDEN.has(char) || char.charCodeAt(0) < FIRST_PRINTABLE ? ' ' : char,
    )
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, LONGEST)
    .trim();

  return name.length === 0 || name.startsWith('.') ? `qazinho ${name}`.trim() : name;
}
