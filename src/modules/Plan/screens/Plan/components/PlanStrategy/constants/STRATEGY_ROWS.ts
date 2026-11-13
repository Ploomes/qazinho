import type { IPlanStrategy } from '@/shared/types';
import type { ParseKeys } from 'i18next';

export const STRATEGY_ROWS: { field: keyof IPlanStrategy; labelKey: ParseKeys }[] = [
  { field: 'covers', labelKey: 'PLAN.STRATEGY_COVERS' },
  { field: 'leavesOut', labelKey: 'PLAN.STRATEGY_LEAVES_OUT' },
  { field: 'where', labelKey: 'PLAN.STRATEGY_WHERE' },
  { field: 'data', labelKey: 'PLAN.STRATEGY_DATA' },
  { field: 'risks', labelKey: 'PLAN.STRATEGY_RISKS' },
];
