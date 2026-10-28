import type { ISuiteTest } from './ISuiteTest';
import type { SuiteFailure } from './SuiteFailure';

/**
 * Os testes de uma suíte como o Playwright os lista, com os projetos na ordem em que a
 * config os declara; ou por que não puderam ser listados, com o que o Playwright disse.
 */
export type SuiteList =
  | { kind: 'listed'; tests: ISuiteTest[]; projects: string[] }
  | { kind: 'failed'; reason: SuiteFailure; said: string };
