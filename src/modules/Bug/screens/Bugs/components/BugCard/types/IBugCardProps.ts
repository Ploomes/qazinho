import type { IBug, IBugMoment } from '@/modules/Bug/types';

/** A bug in the Bugs tab, open or folded, with the latest run that caught it, the moment it did, whether its case is in the plan, and the way to send it to the QA's tracker. */
export interface IBugCardProps {
  workspaceId: string;
  bug: IBug;
  isOpen: boolean;
  hasRun: boolean;
  hasCase: boolean;
  lastRunId: string;
  moment: IBugMoment | null;
  onToggle: (bugId: string) => void;
  onOpenRun: (runId: string) => void;
  onOpenCase: (caseId: string) => void;
  onSend: (bugId: string) => void;
}
