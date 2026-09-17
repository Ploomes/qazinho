import type { OnboardingStep } from '@/modules/Setup/types';
import type { ParseKeys } from 'i18next';

/** The first run, in order, with the word each step wears on the rail. */
export const ONBOARDING_STEPS: { id: OnboardingStep; labelKey: ParseKeys }[] = [
  { id: 'welcome', labelKey: 'SETUP.STEP_WELCOME' },
  { id: 'agents', labelKey: 'SETUP.STEP_AGENTS' },
  { id: 'devices', labelKey: 'SETUP.STEP_DEVICES' },
  { id: 'integrations', labelKey: 'SETUP.STEP_INTEGRATIONS' },
  { id: 'done', labelKey: 'SETUP.STEP_DONE' },
];
