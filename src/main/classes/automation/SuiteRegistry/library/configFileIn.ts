import { SUITE_REGISTRY } from '@/main/classes/automation/SuiteRegistry/constants';

/** The Playwright config among the names in a folder, the TypeScript one first; null for a folder with none. */
export function configFileIn(names: string[]): string | null {
  return SUITE_REGISTRY.configs.find((config) => names.includes(config)) ?? null;
}
