import type { IBug } from '@/modules/Bug';

/** A bug as its file keeps it: an older one says its step and how often it was seen in words, and keeps no sightings, no issue, no look at it, no Figma frame and no word of the QA's that it is no bug. */
export type SavedBug = Omit<
  IBug,
  | 'stepNumber'
  | 'seenRuns'
  | 'agent'
  | 'modelName'
  | 'isIncidental'
  | 'isDismissed'
  | 'at'
  | 'sightings'
  | 'filed'
  | 'reviewedRuns'
  | 'review'
  | 'frame'
> &
  Partial<
    Pick<
      IBug,
      | 'stepNumber'
      | 'seenRuns'
      | 'agent'
      | 'modelName'
      | 'isIncidental'
      | 'isDismissed'
      | 'at'
      | 'sightings'
      | 'filed'
      | 'reviewedRuns'
      | 'review'
      | 'frame'
    >
  > & {
    step?: string;
    seen?: string;
  };
