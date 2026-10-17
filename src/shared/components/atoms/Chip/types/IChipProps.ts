import type { ReactNode } from 'react';

export interface IChipProps {
  children: ReactNode;
  onClick?: () => void;
  dotTone?: string;
  hasCaret?: boolean;
}
