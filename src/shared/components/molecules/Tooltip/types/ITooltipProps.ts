import type { ReactNode } from 'react';

export interface ITooltipProps {
  children: ReactNode;
  content: ReactNode;
  side?: 'below' | 'right';
  isOff?: boolean;
  isWide?: boolean;
}
