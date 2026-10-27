import type { PaneRowTone } from './PaneRowTone';
import type { IconName } from '@/shared/components/atoms/Icon/types';
import type { ReactNode } from 'react';

/** A row of the pane: its icon, what it says, a note while it waits, and its action. */
export interface IPaneRowProps {
  icon: IconName;
  tone: PaneRowTone;
  title: string;
  text: string;
  note?: string;
  children?: ReactNode;
}
