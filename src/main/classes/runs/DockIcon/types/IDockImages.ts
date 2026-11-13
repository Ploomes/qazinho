import type { DockIconKind } from './DockIconKind';
import type { NativeImage } from 'electron';

/** Os ícones já carregados em memória: o original e o de cada estado. */
export interface IDockImages {
  original: NativeImage;
  states: Record<DockIconKind, NativeImage>;
  frames: NativeImage[];
}
