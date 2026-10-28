import type { InternMood } from './InternMood';

/**
 * `isStill` segura a pose parada; `isFigure` o corta justo, para um logo; `isSticker` o
 * desenha como o sticker do logo, recortado, com brilho e inclinado.
 */
export interface IInternProps {
  mood: InternMood;
  size?: number;
  isStill?: boolean;
  isFigure?: boolean;
  isSticker?: boolean;
}
