import type { IImportFramework } from '@/shared/types';
import { IMPORT_FRAMEWORKS } from '@/main/classes/integrations/ImportScanner/constants';

/**
 * Os frameworks de teste que uma pasta guarda, pelos arquivos, pelos manifestos e pelos
 * fluxos do Maestro, e os arquivos que parecem testes. Cada arquivo é de um só.
 */
export function recognizeTests(props: {
  files: string[];
  manifests: string;
  flows: string[];
}): { frameworks: IImportFramework[]; tests: string[] } {
  const claimed = new Set<string>(props.flows);
  const frameworks: IImportFramework[] = [];

  for (const rule of IMPORT_FRAMEWORKS) {
    const isConfigured = props.files.some((file) => rule.config.test(file));
    const isListed = rule.packages.some((name) => props.manifests.includes(name));
    const mine = props.files.filter(
      (file) => rule.tests.test(file) && !claimed.has(file),
    );

    if (!isConfigured && !(isListed && mine.length > 0)) continue;

    for (const file of mine) claimed.add(file);

    frameworks.push({ id: rule.id, files: mine.length });
  }

  if (props.flows.length > 0)
    frameworks.push({ id: 'maestro', files: props.flows.length });

  return {
    frameworks: frameworks.sort((a, b) => b.files - a.files),
    tests: props.files.filter((file) => claimed.has(file)),
  };
}
