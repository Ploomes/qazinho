import type { GithubSignInProgress } from '@/shared/types';

export interface IGithubSignInProps {
  progress: GithubSignInProgress;
  onCancel: () => void;
  onClose: () => void;
  onRetry: () => void;
}
