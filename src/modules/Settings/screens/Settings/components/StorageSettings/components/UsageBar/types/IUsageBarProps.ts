import type { IStorageRow } from '@/modules/Settings/screens/Settings/components/StorageSettings/types';
import type { StorageKind } from '@/modules/Settings/types';
import type { Transition, Variants } from 'motion/react';

export interface IUsageBarProps {
  rows: IStorageRow[];
  segments: IStorageRow[];
  isPending: boolean;
  isEmpty: boolean;
  barMotion: Variants;
  itemMotion: Variants;
  growth: Transition;
  onActivate: (id: StorageKind) => void;
  onDeactivate: () => void;
}
