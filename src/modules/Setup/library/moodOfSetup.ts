import type { InstallState, OnboardingStep } from '@/modules/Setup/types';
import type { InternMood } from '@/shared/components/atoms/Intern/types';

/**
 * Como o Estagiário aparece em cada passo da primeira execução, e enquanto instala ou
 * confere a máquina.
 */
export function moodOfSetup(props: {
  step: OnboardingStep;
  installs: (InstallState | undefined)[];
  isChecking: boolean;
  hasAgent: boolean;
}): InternMood {
  const { step, installs, isChecking, hasAgent } = props;
  const isAtTheMachine = step === 'agents' || step === 'devices';

  if (step === 'done') return 'passed';

  if (isAtTheMachine && installs.some((install) => install?.phase === 'installing'))
    return 'running';

  if (isAtTheMachine && installs.some((install) => install?.phase === 'failed'))
    return 'broken';

  if (isAtTheMachine && isChecking) return 'thinking';

  return step === 'agents' && !hasAgent ? 'flaky' : 'neutral';
}
