import type { InternMood } from './InternMood';

/** O humor e o tamanho dele; parado, cortado justo para um rosto, ou como o ícone. */
export interface IInternProps {
  mood: InternMood;
  size?: number;
  isStill?: boolean;
  isFigure?: boolean;
  isIcon?: boolean;
}
