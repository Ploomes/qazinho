import type { ReactNode } from 'react';

/**
 * Uma run no chat, dobrada numa linha: o dia e a hora em que começou, como está, e tudo o
 * que disse embaixo.
 */
export interface IRunSectionProps {
  at: string;
  day: string;
  title: string;
  facts: string;
  isLive: boolean;
  isExpanded: boolean;
  isExpandable: boolean;
  openLabel: string | null;
  onToggle: () => void;
  onOpen: () => void;
  children: ReactNode;
}
