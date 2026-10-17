import type { TargetKind } from '@/shared/types';

/** Where a run happens: a URL for web, a build on disk for Android and iOS. */
export interface ITarget {
  id: string;
  kind: TargetKind;
  label: string;
  value: string;
}
