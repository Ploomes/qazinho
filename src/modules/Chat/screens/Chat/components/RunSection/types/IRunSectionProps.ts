import type { ReactNode } from 'react';

/**
 * A run in the chat, folded into one line: the day and time it started, how it stands,
 * and everything it said underneath.
 */
export interface IRunSectionProps {
  at: string;
  day: string;
  title: string;
  facts: string;
  countLabel: string;
  isLive: boolean;
  isExpanded: boolean;
  isExpandable: boolean;
  openLabel: string | null;
  onToggle: () => void;
  onOpen: () => void;
  children: ReactNode;
}
