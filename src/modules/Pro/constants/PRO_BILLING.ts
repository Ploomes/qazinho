import type { ProBillingStatus } from '@/shared/types';
import type { ParseKeys } from 'i18next';

export const PRO_BILLING: Record<
  ProBillingStatus,
  { labelKey: ParseKeys; tone: 'pass' | 'attn' | 'fail' | 'skip' }
> = {
  trialing: { labelKey: 'PRO.BILLING_TRIALING', tone: 'pass' },
  active: { labelKey: 'PRO.BILLING_ACTIVE', tone: 'pass' },
  past_due: { labelKey: 'PRO.BILLING_PAST_DUE', tone: 'attn' },
  blocked: { labelKey: 'PRO.BILLING_BLOCKED', tone: 'fail' },
  canceled: { labelKey: 'PRO.BILLING_CANCELED', tone: 'skip' },
};
