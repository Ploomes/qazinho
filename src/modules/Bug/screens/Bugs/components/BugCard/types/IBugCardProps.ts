import type { IBug, IBugMoment } from '@/modules/Bug/types';

export interface IBugCardProps {
  bug: IBug;
  isOpen: boolean;
  hasRun: boolean;
  moment: IBugMoment | null;
  onToggle: (bugId: string) => void;
  onOpenRun: (runId: string) => void;
  onOpenCase: () => void;
}
