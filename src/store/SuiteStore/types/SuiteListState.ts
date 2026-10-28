import type { SuiteList } from '@/shared/types';

/**
 * Os testes de uma suíte como a página os tem: ainda sendo listados, listados, ou por que
 * não puderam ser.
 */
export type SuiteListState = { kind: 'loading' } | SuiteList;
