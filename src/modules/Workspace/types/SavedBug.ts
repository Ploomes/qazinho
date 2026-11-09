import type { IBug } from '@/modules/Bug';

/** Um bug como o arquivo dele o guarda, um antigo incluído. */
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
  | 'design'
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
      | 'design'
    >
  > & {
    step?: string;
    seen?: string;
  };
