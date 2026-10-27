import type { IBug } from '@/modules/Bug';

/** A bug as its file keeps it, an older one included. */
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
