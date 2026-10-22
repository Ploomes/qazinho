import type { IBug, IBugMoment } from '@/modules/Bug/types';

/** A bug in the Bugs tab, open or folded, with the latest run that caught it, the moment it did, and the way to send it to the QA's tracker. */
export interface IBugCardProps {
  bug: IBug;
  isOpen: boolean;
  hasRun: boolean;
  lastRunId: string;
  moment: IBugMoment | null;
  onToggle: (bugId: string) => void;
  onOpenRun: (runId: string) => void;
  onOpenCase: () => void;
  onSend: (bugId: string) => void;
}
