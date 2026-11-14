import type { IconName } from '@/shared/components/atoms/Icon/types';
import type { ReactNode } from 'react';

/** Um campo da segunda tela: o cartão que ele marcou, o controle, e como ele está. */
export interface IFieldCardProps {
  icon: IconName;
  label: string;
  statusText: string;
  statusClassName: string;
  children: ReactNode;
}
