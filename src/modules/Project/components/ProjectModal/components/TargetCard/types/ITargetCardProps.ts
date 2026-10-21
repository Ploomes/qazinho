import type { ITargetLock } from './ITargetLock';
import type { TargetKind } from '@/shared/types';
import type { ReactNode } from 'react';

/** One part of a project: its field beside its name and logo, or under its name when stacked, or why it is locked on this machine. */
export interface ITargetCardProps {
  name: string;
  text: string;
  lock: ITargetLock | null;
  platform?: TargetKind;
  isStacked?: boolean;
  children: ReactNode;
}
