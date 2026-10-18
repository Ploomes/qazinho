import type { ITargetLock } from './ITargetLock';
import type { ReactNode } from 'react';

/** One platform a project can target: its field, or why it is locked on this machine. */
export interface ITargetCardProps {
  name: string;
  text: string;
  lock: ITargetLock | null;
  children: ReactNode;
}
