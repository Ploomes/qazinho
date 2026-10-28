import type { ISuiteResult, ISuiteRun, ISuiteTest } from '@/modules/Automation/types';

/**
 * Um teste da suíte, arquivado sob a pasta de uma história do jeito que o time de QA os
 * escreve.
 */
export const suiteTest = (props: Partial<ISuiteTest>): ISuiteTest => ({
  id: 't-1',
  file: 'tests/hc-1139/ct-nav.spec.ts',
  line: 10,
  path: ['CT-NAV · Navegação'],
  title: 'CT-NAV-001 · Abre a lista',
  tags: [],
  project: 'chromium',
  ...props,
});

/** Como um teste foi numa run. */
export const suiteResult = (props: Partial<ISuiteResult>): ISuiteResult => ({
  testId: 't-1',
  title: 'CT-NAV-001 · Abre a lista',
  file: 'tests/hc-1139/ct-nav.spec.ts',
  line: 10,
  project: 'chromium',
  status: 'passed',
  isFlaky: false,
  durationMs: 1_200,
  error: null,
  attachments: [],
  ...props,
});

/** Uma run da suíte. */
export const suiteRun = (props: Partial<ISuiteRun>): ISuiteRun => ({
  id: 's-01',
  projectId: 'p-1',
  startedAt: 1_000,
  endedAt: 9_000,
  status: 'passed',
  total: 1,
  results: [],
  failure: null,
  said: '',
  ...props,
});
