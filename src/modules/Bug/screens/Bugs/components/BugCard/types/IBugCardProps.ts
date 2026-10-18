import type { IBug } from '@/modules/Bug/types';

export interface IBugCardProps {
  bug: IBug;
  isOpen: boolean;
  hasRun: boolean;
  onToggle: (bugId: string) => void;
  onOpenRun: (runId: string) => void;
  onOpenCase: () => void;
}
