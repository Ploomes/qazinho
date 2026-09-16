import type { TargetKind } from '@/modules/Project/types';

/** A plan is drafted for a screen size, not for an OS: Android and iOS read the same. */
export function toPlanKind(kind: TargetKind): 'web' | 'mobile' {
  return kind === 'web' ? 'web' : 'mobile';
}
