import type { IBug, IBugMoment } from '@/modules/Bug/types';

/**
 * Um bug na aba Bugs, aberto ou dobrado, com a última vez em que foi pego, o momento dele
 * e os jeitos de respondê-lo.
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
