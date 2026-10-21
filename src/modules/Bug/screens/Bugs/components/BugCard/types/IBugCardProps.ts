import type { IBug, IBugMoment } from '@/modules/Bug/types';

/** A bug in the Bugs tab, open or folded, with the latest run that caught it and the moment it did. */
export interface IBugCardProps {
  bug: IBug;
  isOpen: boolean;
  hasRun: boolean;
  lastRunId: string;
  moment: IBugMoment | null;
  onToggle: (bugId: string) => void;
  onOpenRun: (runId: string) => void;
  onOpenCase: () => void;
}
