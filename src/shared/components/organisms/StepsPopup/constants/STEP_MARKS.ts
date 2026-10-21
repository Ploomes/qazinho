import type { IconName } from '@/shared/components/atoms/Icon/types';
import type { StepRowState } from '@/shared/components/organisms/StepsPopup/types';

export const STEP_MARKS: Record<StepRowState, IconName | null> = {
  done: 'check',
  failed: 'close',
  active: null,
  pending: null,
};
