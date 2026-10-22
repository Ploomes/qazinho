import type { FilingRowState } from '@/modules/Bug/types';
import type { StepRowState } from '@/shared/components/organisms/StepsPopup/types';

export const FILING_ROW_STATES: Record<FilingRowState, StepRowState> = {
  pending: 'pending',
  working: 'active',
  done: 'done',
  failed: 'failed',
};
