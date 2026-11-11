import type { IBug, IBugMoment } from '@/modules/Bug/types';

/** Um bug aberto como página, com a última vez em que foi pego, o momento e as ações. */
export interface IBugPageProps {
  workspaceId: string;
  bug: IBug;
  hasRun: boolean;
  hasCase: boolean;
  lastRunId: string;
  moment: IBugMoment | null;
  onBack: () => void;
  onOpenRun: (runId: string) => void;
  onOpenCase: (caseId: string) => void;
  onSend: (bugId: string) => void;
  onDismiss: (props: { bugId: string; isDismissed: boolean }) => void;
}
