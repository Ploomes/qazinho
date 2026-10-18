const FORBIDDEN = new Set(['/', '\\', ':', '*', '?', '"', '<', '>', '|']);
const FIRST_PRINTABLE = 32;
const LONGEST = 120;

/** A file name the QA can read, from a label: what no file system takes becomes a space. */
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
