import type { DockIconKind } from './DockIconKind';
import type { BrowserWindow } from 'electron';

/** O que o `DockIcon` recebe: os arquivos dos ícones e como alcançar a janela. */
export interface IDockIcon {
  icon: string;
  states: Record<DockIconKind, string>;
  frames: string[];
  window: () => BrowserWindow | null;
  isAway: () => boolean;
}
