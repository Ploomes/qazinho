import type { ITargetLock } from './ITargetLock';
import type { ReactNode } from 'react';

/** One part of a project: its field beside its name, or under it when stacked, or why it is locked on this machine. */
export interface ITargetCardProps {
  name: string;
  text: string;
  lock: ITargetLock | null;
  isStacked?: boolean;
  children: ReactNode;
}
