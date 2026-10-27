import type { FilingStep } from '@/shared/types';

/**
 * A step the popup lists while a bug goes out: the page getting its evidence ready, then
 * each step main takes.
 */
export type FilingRow = 'ready' | FilingStep;
