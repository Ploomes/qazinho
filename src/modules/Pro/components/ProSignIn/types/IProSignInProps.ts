import type { ProSignInProgress } from '@/shared/types';

export interface IProSignInProps {
  progress: ProSignInProgress;
  onCancel: () => void;
  onClose: () => void;
  onRetry: () => void;
}
