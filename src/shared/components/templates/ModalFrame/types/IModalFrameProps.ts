import type { ReactNode } from 'react';

/**
 * O título, o corpo e o rodapé que confirma um modal, com mais uma ação à esquerda; um
 * nav põe as seções dele ao lado do corpo, cada um rolando sozinho.
 */
export interface IModalFrameProps {
  title: string;
  subtitle?: string;
  width: number;
  height?: number;
  confirmLabel: string;
  canConfirm: boolean;
  children?: ReactNode;
  nav?: ReactNode;
  hint?: string;
  aside?: ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
}
