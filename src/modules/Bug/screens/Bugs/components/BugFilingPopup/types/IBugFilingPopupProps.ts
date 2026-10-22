import type { IBug, IBugFiling } from '@/modules/Bug/types';

export interface IBugFilingPopupProps {
  filing: IBugFiling;
  bug: IBug;
  onClose: () => void;
  onRetry: () => void;
}
