import type { BugFiling, IFilingEvent } from '@/shared/types';

/**
 * What moves a bug's sending along: its evidence got ready, main took a step, or it
 * ended.
 */
export type FilingChange =
  | { kind: 'ready' }
  | { kind: 'step'; event: IFilingEvent }
  | { kind: 'ended'; result: BugFiling };
