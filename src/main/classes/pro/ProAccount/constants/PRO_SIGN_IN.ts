import type { ProSignInStep } from '@/shared/types';

export const PRO_SIGN_IN: { steps: ProSignInStep[]; pollFloorMs: number } = {
  steps: ['code', 'browser', 'account'],
  pollFloorMs: 2_000,
};
