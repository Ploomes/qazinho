import type { IBug, IBugMoment } from '@/modules/Bug/types';

/**
 * A bug in the Bugs tab, open or folded, with its latest catch, its moment and the ways
 * to answer it.
 */
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
  onDismiss: (props: { bugId: string; isDismissed: boolean }) => void;
}
