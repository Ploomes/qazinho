import type { ReactNode } from 'react';

/** A modal's title, body and the footer that confirms it; a nav puts its sections beside the body, each scrolling on its own. */
export interface IModalFrameProps {
  title: string;
  subtitle: string;
  width: number;
  height?: number;
  confirmLabel: string;
  canConfirm: boolean;
  children: ReactNode;
  nav?: ReactNode;
  hint?: string;
  aside?: ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
}
