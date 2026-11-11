import type { OnboardingStep } from '@/modules/Setup/types';
import type { ParseKeys } from 'i18next';

export const ONBOARDING_STEPS: {
  id: OnboardingStep;
  titleKey: ParseKeys;
  leadKey: ParseKeys;
}[] = [
  { id: 'welcome', titleKey: 'SETUP.WELCOME_TITLE', leadKey: 'SETUP.WELCOME_LEAD' },
  { id: 'agents', titleKey: 'SETUP.AGENTS_TITLE', leadKey: 'SETUP.AGENTS_LEAD' },
  { id: 'devices', titleKey: 'SETUP.DEVICES_TITLE', leadKey: 'SETUP.DEVICES_SAY_INTRO' },
  {
    id: 'integrations',
    titleKey: 'SETUP.INTEGRATIONS_TITLE',
    leadKey: 'SETUP.INTEGRATIONS_LEAD',
  },
];
