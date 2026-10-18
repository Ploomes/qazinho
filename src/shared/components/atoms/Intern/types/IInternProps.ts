import type { InternMood } from './InternMood';

/** `isStill` holds his still pose; `isFigure` crops him tight, for a logo; `isOnIndigo` casts his shadow on the brand's indigo. */
export interface IInternProps {
  mood: InternMood;
  size?: number;
  isStill?: boolean;
  isFigure?: boolean;
  isOnIndigo?: boolean;
}
