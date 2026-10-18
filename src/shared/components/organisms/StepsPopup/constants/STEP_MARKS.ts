import type { StepRowState } from '@/shared/components/organisms/StepsPopup/types';

export const STEP_MARKS: Record<StepRowState, string> = {
  done: '✓',
  failed: '✕',
  active: '',
  pending: '',
};
