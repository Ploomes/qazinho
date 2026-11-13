import type { IRunStep } from '@/modules/Run/types';

/**
 * Como um caso foi andado: pelo QA à mão, de novo sem o agente, ajustado quando o agente
 * precisou assumir, ou null para um passeio do próprio agente.
 */
export function caseWalkOf(
  steps: Pick<IRunStep, 'by'>[],
): 'qa' | 'replay' | 'healed' | null {
  if (steps.some(({ by }) => by === 'qa')) return 'qa';

  if (steps.some(({ by }) => by === 'healed')) return 'healed';

  return steps.length > 0 && steps.every(({ by }) => by === 'replay') ? 'replay' : null;
}
