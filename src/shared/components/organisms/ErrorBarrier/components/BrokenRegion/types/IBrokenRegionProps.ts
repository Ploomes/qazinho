import type { ErrorRegion } from '@/shared/components/organisms/ErrorBarrier/types';

/** O aviso de uma região quebrada: qual, o erro que a derrubou e como recarregá-la. */
export interface IBrokenRegionProps {
  region: ErrorRegion;
  error: Error;
  onRetry: () => void;
}
