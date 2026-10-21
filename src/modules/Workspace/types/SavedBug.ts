import type { IBug } from '@/modules/Bug';

/** A bug as its file keeps it: an older one says its step and how often it was seen in words, and keeps no sightings. */
export type SavedBug = Omit<
  IBug,
  'stepNumber' | 'seenRuns' | 'agent' | 'modelName' | 'isIncidental' | 'at' | 'sightings'
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
    >
  > & {
    step?: string;
    seen?: string;
  };
