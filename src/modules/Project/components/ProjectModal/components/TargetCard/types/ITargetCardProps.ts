import type { ITargetLock } from './ITargetLock';
import type { TargetKind } from '@/shared/types';
import type { ReactNode } from 'react';

/**
 * Uma parte de um projeto: o campo ao lado do nome e do logo, ou sob o nome quando
 * empilhado, ou por que está travada nesta máquina.
 */
export interface ITargetCardProps {
  name: string;
  text: string;
  lock: ITargetLock | null;
  platform?: TargetKind;
  isStacked?: boolean;
  children: ReactNode;
}
