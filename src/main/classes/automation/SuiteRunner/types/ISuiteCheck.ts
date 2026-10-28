import type { ISuiteResult, SuiteFailure } from '@/shared/types';

/**
 * Alguns testes rodados de outra cópia de uma suíte, fora das runs do projeto: como cada
 * um foi, ou por que nenhum rodou, com o que o Playwright disse.
 */
export interface ISuiteCheck {
  results: ISuiteResult[];
  failure: SuiteFailure | null;
  said: string;
}
