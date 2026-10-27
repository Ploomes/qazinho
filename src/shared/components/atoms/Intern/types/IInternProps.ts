import type { InternMood } from './InternMood';

/**
 * `isStill` holds his still pose; `isFigure` crops him tight, for a logo; `isSticker`
 * draws him as the logo's sticker, cut, glossed and tilted.
 */
export interface IInternProps {
  mood: InternMood;
  size?: number;
  isStill?: boolean;
  isFigure?: boolean;
  isSticker?: boolean;
}
