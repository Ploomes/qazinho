import type { InternMood } from './InternMood';

/** `isStill` holds his still pose; `isFigure` crops him tight, for a logo. */
export interface IInternProps {
  mood: InternMood;
  size?: number;
  isStill?: boolean;
  isFigure?: boolean;
}
