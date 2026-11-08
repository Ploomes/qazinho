import type { BUG_FLASH_HEADLINES } from '@/modules/Device/constants';
import type { BugCategory } from '@/shared/types';

/** A frase grande de um bug pego, pelo tipo dele. */
export type BugFlashHeadline =
  (typeof BUG_FLASH_HEADLINES)[BugCategory]['plain' | 'design'] | 'DEVICE.BUG_DESIGN';
