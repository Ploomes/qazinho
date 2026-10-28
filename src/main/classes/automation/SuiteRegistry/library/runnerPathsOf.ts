import { dirname, join, parse } from 'node:path';
import { SUITE_REGISTRY } from '@/main/classes/automation/SuiteRegistry/constants';

/**
 * Onde o Playwright Test de uma suíte poderia estar instalado, da própria pasta dela até
 * a raiz, do jeito que o Node procura um pacote.
 */
export function runnerPathsOf(path: string): string[] {
  const { root } = parse(path);
  const paths: string[] = [];

  for (let folder = path; ; folder = dirname(folder)) {
    paths.push(join(folder, ...SUITE_REGISTRY.runner));

    if (folder === root || dirname(folder) === folder) return paths;
  }
}
