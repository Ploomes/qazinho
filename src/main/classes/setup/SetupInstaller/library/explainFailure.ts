/** What a failed command said from its last error on, and the fix it suggested to run, when it suggested one. */
export function explainFailure(lines: string[]): { error: string; fix: string | null } {
  const from = lines.findLastIndex((line) => /^error:/i.test(line));
  const said = from < 0 ? lines : lines.slice(from);
  const fixes = said.filter((line) =>
    /^((sudo )?(chown|chmod) |xcode-select --install$)/.test(line),
  );

  return { error: said.join('\n'), fix: fixes.length === 0 ? null : fixes.join(' && ') };
}
