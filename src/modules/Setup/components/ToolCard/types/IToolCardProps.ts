import type { ReactNode } from 'react';

/**
 * Uma ferramenta nesta máquina: achada, faltando, ou desligada. Com `onSelect` é uma
 * opção a escolher, `isSelected` a escolhida.
 */
export interface IToolCardProps {
  name: string;
  about: string;
  detail: string;
  state: 'found' | 'missing' | 'off';
  badge: string;
  action?: ReactNode;
  children?: ReactNode;
  isSelected?: boolean;
  onSelect?: () => void;
}
