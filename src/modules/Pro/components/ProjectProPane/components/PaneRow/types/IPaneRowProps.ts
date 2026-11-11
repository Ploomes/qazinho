import type { ReactNode } from 'react';

/** Uma linha do painel: o que diz, uma nota enquanto espera, e a ação. */
export interface IPaneRowProps {
  title: string;
  text?: string;
  note?: string;
  children?: ReactNode;
}
