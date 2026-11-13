import type { DockIconKind } from './DockIconKind';

/** O que o ícone mostra agora: qual ícone de estado, a barra de progresso e o badge. */
export interface IDockView {
  icon: DockIconKind | null;
  progress: number | null;
  badge: string;
}
