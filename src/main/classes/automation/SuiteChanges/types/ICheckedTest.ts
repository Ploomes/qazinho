import type { ISuiteResult } from '@/shared/types';

/**
 * Como um teste foi numa run que o agente pediu, com o que o Playwright anotou da falha
 * dele e onde estão os screenshots.
 */
export interface ICheckedTest {
  result: ISuiteResult;
  notes: string;
  screenshots: string[];
}
