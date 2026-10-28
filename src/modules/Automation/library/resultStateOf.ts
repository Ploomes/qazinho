import type { ISuiteResult, SuiteResultState } from '@/modules/Automation/types';

/**
 * Como um teste foi numa run como o QA lê: um passe numa nova tentativa é flaky, qualquer
 * outra coisa é o que o Playwright disse.
 */
export function resultStateOf(
  result: Pick<ISuiteResult, 'status' | 'isFlaky'>,
): SuiteResultState {
  return result.status === 'passed' && result.isFlaky ? 'flaky' : result.status;
}
