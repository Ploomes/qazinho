import type { IBug } from '@/modules/Bug';

/** A bug as its file keeps it: one saved before bugs counted in numbers says its step and how often it was seen in words. */
export type SavedBug = Omit<
  IBug,
  'stepNumber' | 'seenRuns' | 'agent' | 'modelName' | 'isIncidental' | 'at'
> &
  Partial<
    Pick<IBug, 'stepNumber' | 'seenRuns' | 'agent' | 'modelName' | 'isIncidental' | 'at'>
  > & {
    step?: string;
    seen?: string;
  };
