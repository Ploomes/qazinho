import type { PaneRowTone } from './PaneRowTone';
import type { IconName } from '@/shared/components/atoms/Icon/types';
import type { ReactNode } from 'react';

/** Uma linha do painel: o ícone, o que diz, uma nota enquanto espera, e a ação. */
export interface IPaneRowProps {
  icon: IconName;
  tone: PaneRowTone;
  title: string;
  text?: string;
  note?: string;
  children?: ReactNode;
}
