import type { IDraftedCase } from '@/shared/types';

/**
 * O plano que uma exploração sugeriu: o que o explorador disse do app, e os casos que
 * testaria.
 */
export interface IRunSuggestion {
  summary: string;
  cases: IDraftedCase[];
}
