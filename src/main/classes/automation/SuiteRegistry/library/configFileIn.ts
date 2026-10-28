import { SUITE_REGISTRY } from '@/main/classes/automation/SuiteRegistry/constants';

/**
 * A config do Playwright entre os nomes de uma pasta, a de TypeScript primeiro; null para
 * uma pasta sem nenhuma.
 */
export function configFileIn(names: string[]): string | null {
  return SUITE_REGISTRY.configs.find((config) => names.includes(config)) ?? null;
}
