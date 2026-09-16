import type { IBug } from '@/modules/Bug/types';

export interface IBugCardProps {
  bug: IBug;
  isOpen: boolean;
  onToggle: (bugId: string) => void;
  onOpenRun: () => void;
  onOpenCase: () => void;
}
