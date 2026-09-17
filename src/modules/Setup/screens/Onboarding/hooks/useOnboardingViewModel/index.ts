import type { OnboardingStep } from '@/modules/Setup/types';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ONBOARDING_STEPS } from '@/modules/Setup/constants';
import { useMachineCheck } from '@/modules/Setup/hooks';
import { useAppStore, useMachineStore, useSettingsStore, useSetupStore } from '@/store';

export const useOnboardingViewModel = () => {
  const { t } = useTranslation();
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [direction, setDirection] = useState(1);
  const hasChecked = useRef(false);
  const agents = useMachineStore((state) => state.agents);
  const integrations = useSetupStore((state) => state.integrations);
  const agentInUse = useSettingsStore((state) => state.agent);
  const selectAgent = useSettingsStore((state) => state.selectAgent);
  const finishOnboarding = useSettingsStore((state) => state.finishOnboarding);
  const openModal = useAppStore((state) => state.openModal);
  const { check } = useMachineCheck();

  // The first look happens on the way in, so the agents step opens on what is really here.
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
  const hasAgent = agents.some(({ isFound }) => isFound);

  const go = (target: number) => {
    const next = ONBOARDING_STEPS[Math.min(Math.max(target, 0), last)];

    if (next === undefined) return;

    setDirection(target >= index ? 1 : -1);
    setStep(next.id);
  };

  return {
    step,
    enterX: 24 * direction,
    exitX: -24 * direction,
    eyebrow: t('SETUP.STEP_OF', { step: index + 1, total: ONBOARDING_STEPS.length }),
    title: t(`SETUP.${step.toUpperCase()}_TITLE` as 'SETUP.WELCOME_TITLE'),
    body: t(`SETUP.${step.toUpperCase()}_BODY` as 'SETUP.WELCOME_BODY'),
    progress: `${String(Math.round((index / last) * 100))}%`,
    progressLabel: t('SETUP.PROGRESS', { done: index, total: last }),
    isFirst: index === 0,
    isLast: index === last,
    nextLabel:
      step === 'welcome'
        ? t('SETUP.START')
        : step === 'agents' && !hasAgent
          ? t('SETUP.CONTINUE_WITHOUT_AGENT')
          : step === 'integrations' && integrations.length === 0
            ? t('SETUP.SKIP_FOR_NOW')
            : t('SETUP.CONTINUE'),
    rail: ONBOARDING_STEPS.map((item, position) => ({
      id: item.id,
      label: t(item.labelKey),
      mark: position < index ? '✓' : String(position + 1).padStart(2, '0'),
      ariaCurrent: position === index ? ('step' as const) : undefined,
      state:
        position < index
          ? ('done' as const)
          : position === index
            ? ('current' as const)
            : ('todo' as const),
      canVisit: position < index,
      onVisit: () => {
        go(position);
      },
    })),
    onNext: () => {
      // Leaving the agents step on an agent that is not here would start the app on one that cannot answer.
      const found = agents.find(({ isFound }) => isFound);
      const isInUseHere = agents.some(
        ({ name, isFound }) => isFound && name === agentInUse,
      );

      if (step === 'agents' && found !== undefined && !isInUseHere)
        selectAgent(found.name);

      go(index + 1);
    },
    onBack: () => {
      go(index - 1);
    },
    onSkipAll: finishOnboarding,
    onFinish: finishOnboarding,
    onCreateProject: () => {
      finishOnboarding();
      openModal('project');
    },
  };
};
