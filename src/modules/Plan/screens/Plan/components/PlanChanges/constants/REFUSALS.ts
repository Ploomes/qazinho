import type { RefusalReason } from '@/modules/Plan/types';
import type { ParseKeys } from 'i18next';

export const REFUSALS: { reason: RefusalReason; labelKey: ParseKeys }[] = [
  { reason: 'no-test-change', labelKey: 'PLAN.REVIEW_REFUSE_NO_TEST' },
  { reason: 'wrong-read', labelKey: 'PLAN.REVIEW_REFUSE_WRONG' },
  { reason: 'other', labelKey: 'PLAN.REVIEW_REFUSE_OTHER' },
];
