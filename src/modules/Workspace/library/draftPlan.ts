import type { ITestCase } from '@/modules/Plan/types';
import { PLANS } from '@/modules/Plan/constants';

/** Stands in for the agent drafting a plan, until one answers over ACP. */
export function draftPlan(kind: 'web' | 'mobile'): ITestCase[] {
  return PLANS[kind].map((draft, index) => ({
    ...draft,
    id: `TC-${String(index + 1).padStart(2, '0')}`,
    lastVerdict: null,
  }));
}
