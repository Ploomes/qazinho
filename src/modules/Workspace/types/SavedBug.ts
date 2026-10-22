import type { IBug } from '@/modules/Bug';

/** A bug as its file keeps it: an older one says its step and how often it was seen in words, and keeps no sightings, no issue and no look at it. */
export type SavedBug = Omit<
  IBug,
  | 'stepNumber'
  | 'seenRuns'
  | 'agent'
  | 'modelName'
  | 'isIncidental'
  | 'at'
  | 'sightings'
  | 'filed'
  | 'reviewedRuns'
  | 'review'
> &
  Partial<
    Pick<
      IBug,
      | 'stepNumber'
      | 'seenRuns'
      | 'agent'
      | 'modelName'
      | 'isIncidental'
      | 'at'
      | 'sightings'
      | 'filed'
      | 'reviewedRuns'
      | 'review'
    >
  > & {
    step?: string;
    seen?: string;
  };
