import type { ReactNode } from 'react';

/** Um link da frase do cabeçalho que sai do app, com o botão que o solta quando dá. */
export interface IMetaLinkProps {
  href: string;
  title: string;
  children?: ReactNode;
  dropLabel?: string;
  onDrop?: () => void;
}
