import type { ManualPrep } from '@/shared/types';
import type { ParseKeys } from 'i18next';

export const MANUAL_PREP_KEYS = {
  replayed: 'DEVICE.MANUAL_PREP_REPLAYED',
  agent: 'DEVICE.MANUAL_PREP_AGENT',
  failed: 'DEVICE.MANUAL_PREP_FAILED',
} as const satisfies Record<Exclude<ManualPrep, 'none'>, ParseKeys>;
