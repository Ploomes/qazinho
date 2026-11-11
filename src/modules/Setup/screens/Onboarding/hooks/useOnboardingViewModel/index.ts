import type { OnboardingStep } from '@/modules/Setup/types';
import type { CSSProperties } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ONBOARDING_SCREEN, ONBOARDING_STEPS } from '@/modules/Setup/constants';
import { useMachineCheck } from '@/modules/Setup/hooks';
import { devicesLineOf, moodOfSetup } from '@/modules/Setup/library';
import { Platform } from '@/services';
import { useMachineStore, useSettingsStore, useSetupStore } from '@/store';

export const useOnboardingViewModel = () => {
  const { t } = useTranslation();
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [direction, setDirection] = useState(1);
  const hasChecked = useRef(false);
  const agents = useMachineStore((state) => state.agents);
  const tools = useMachineStore((state) => state.tools);
  const installs = useSetupStore((state) => state.installs);
  const agentInUse = useSettingsStore((state) => state.agent);
  const selectAgent = useSettingsStore((state) => state.selectAgent);
  const finishOnboarding = useSettingsStore((state) => state.finishOnboarding);
  const { isChecking, check } = useMachineCheck();

  useEffect(() => {
    if (hasChecked.current) return;

    hasChecked.current = true;
    void check();
  }, [check]);

  const index = Math.max(
    0,
    ONBOARDING_STEPS.findIndex(({ id }) => id === step),
  );
  const last = ONBOARDING_STEPS.length - 1;
  const current = ONBOARDING_STEPS[index];
  const hasAgent = agents.some(
    ({ isFound, isSignedIn }) => isFound && isSignedIn !== false,
  );

  const go = (target: number) => {
    const next = ONBOARDING_STEPS[Math.min(Math.max(target, 0), last)];

    if (next === undefined) return;

    setDirection(target >= index ? 1 : -1);
    setStep(next.id);
  };

  return {
    step,
    style: {
      '--onboarding-column': `${String(ONBOARDING_SCREEN.column)}px`,
    } as CSSProperties,
    internSize: ONBOARDING_SCREEN.intern,
    enterY: 12 * direction,
    exitY: -12 * direction,
    mood: moodOfSetup({ step, installs: Object.values(installs), isChecking, hasAgent }),
    title: current === undefined ? '' : t(current.titleKey),
    lead:
      step === 'agents' && !hasAgent && !isChecking
        ? t('SETUP.AGENTS_LEAD_NONE')
        : step === 'devices'
          ? devicesLineOf({ isMac: Platform.isMac(), tools })
              .map((key) => t(key))
              .join(' ')
          : current === undefined
            ? ''
            : t(current.leadKey),
    isFirst: index === 0,
    nextLabel:
      step === 'agents' && !hasAgent
        ? t('SETUP.CONTINUE_WITHOUT_AGENT')
        : t('SETUP.CONTINUE'),
    skipLabel: t('SETUP.SKIP_SETUP'),
    backLabel: t('SETUP.BACK'),
    onNext: () => {
      const found = agents.find(({ isFound }) => isFound);
      const isInUseHere = agents.some(
        ({ name, isFound }) => isFound && name === agentInUse,
      );

      if (step === 'agents' && found !== undefined && !isInUseHere)
        selectAgent(found.name);

      if (index === last) {
        finishOnboarding();

        return;
      }

      go(index + 1);
    },
    onBack: () => {
      go(index - 1);
    },
    onSkipAll: finishOnboarding,
  };
};
