import type { ReactNode } from 'react';

export interface IModalFrameProps {
  title: string;
  subtitle: string;
  width: number;
  confirmLabel: string;
  canConfirm: boolean;
  children: ReactNode;
  hint?: string;
  aside?: ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
}
