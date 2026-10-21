import type { IRunStep } from '@/modules/Run/types';

/** How a case was walked: again without the agent when every step was, healed when the agent had to take over, or null for an agent's own walk. */
export function caseWalkOf(steps: Pick<IRunStep, 'by'>[]): 'replay' | 'healed' | null {
  if (steps.some(({ by }) => by === 'healed')) return 'healed';

  return steps.length > 0 && steps.every(({ by }) => by === 'replay') ? 'replay' : null;
}
