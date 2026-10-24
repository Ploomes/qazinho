/** Up to two letters for a person, from their name, or from their e-mail when it is all there is. */
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
