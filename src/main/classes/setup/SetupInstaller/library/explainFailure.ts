import type { InstallFailure } from '@/shared/types';

/**
 * O que um comando que falhou disse a partir do último erro, e o conserto que ele sugeriu
 * rodar, quando sugeriu um.
 */
export function explainFailure(lines: string[]): {
  failure: InstallFailure;
  fix: string | null;
} {
  const from = lines.findLastIndex((line) => /^error:/i.test(line));
  const said = from < 0 ? lines : lines.slice(from);
  const fixes = said.filter((line) =>
    /^((sudo )?(chown|chmod) |xcode-select --install$)/.test(line),
  );

  return {
    failure: { reason: 'said', text: said.join('\n') },
    fix: fixes.length === 0 ? null : fixes.join(' && '),
  };
}
