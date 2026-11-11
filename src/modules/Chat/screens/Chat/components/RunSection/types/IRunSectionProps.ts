import type { IActivityLine } from '@/modules/Chat/types';
import type { ReactNode } from 'react';

/**
 * Uma run no chat, dobrada numa linha: o dia e a hora em que começou, como está, e tudo o
 * que disse embaixo.
 */
export interface IRunSectionProps {
  title: string;
  facts: string;
  isLive: boolean;
  isExpanded: boolean;
  isExpandable: boolean;
  openLabel: string | null;
  activity: IActivityLine[];
  onToggle: () => void;
  onOpen: () => void;
  children: ReactNode;
}
