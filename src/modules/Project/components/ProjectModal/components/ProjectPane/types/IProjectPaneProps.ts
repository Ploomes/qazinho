import type { ReactNode } from 'react';

/**
 * Uma seção da janela do projeto, aberta ou mantida fechada com o que foi digitado nela.
 */
export interface IProjectPaneProps {
  label: string;
  isOpen: boolean;
  children: ReactNode;
}
