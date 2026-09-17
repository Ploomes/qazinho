import type { InstallState } from '@/modules/Setup/types';

export interface IInstallProgressProps {
  state: InstallState;
  onRetry: () => void;
}
