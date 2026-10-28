/** Até duas letras para uma pessoa, do nome dela, ou do e-mail quando é tudo o que há. */
export function initialsOf(name: string): string {
  const words =
    name
      .split('@')[0]
      ?.split(/[\s._-]+/)
      .filter(Boolean) ?? [];
  const first = words[0]?.[0] ?? '';
  const last = words.length > 1 ? (words.at(-1)?.[0] ?? '') : '';

  return `${first}${last}`.toUpperCase();
}
