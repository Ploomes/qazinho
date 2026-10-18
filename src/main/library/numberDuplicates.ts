/** Numbers the controls that read alike, #1, #2… in page order, so the agent can name the one it means. */
export function numberDuplicates(lines: string[]): string[] {
  const totals = new Map<string, number>();
  const seen = new Map<string, number>();

  for (const line of lines) totals.set(line, (totals.get(line) ?? 0) + 1);

  return lines.map((line) => {
    if (totals.get(line) === 1) return line;

    const number = (seen.get(line) ?? 0) + 1;

    seen.set(line, number);

    return `${line} #${String(number)}`;
  });
}
