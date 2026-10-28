import type { ISuiteChange } from '@/modules/Automation/types';

/**
 * Os testes novos que o QA pediu ao agente dele e não jogou fora, os mais recentes
 * primeiro.
 */
export function requestsOf(changes: ISuiteChange[]): ISuiteChange[] {
  return changes
    .filter(({ ask, status }) => ask.kind === 'write' && status !== 'discarded')
    .sort((one, other) => other.startedAt - one.startedAt);
}
