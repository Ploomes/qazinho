import type { TargetKind } from '@/shared/types';

/** Onde uma run acontece: uma URL para a web, um build em disco para Android e iOS. */
export interface ITarget {
  id: string;
  kind: TargetKind;
  label: string;
  value: string;
}
