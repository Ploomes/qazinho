import type { InternMood } from './InternMood';

/** `isStill` holds the first pose; `isFigure` drops the stage around him, for a logo. */
export interface IInternProps {
  mood: InternMood;
  size?: number;
  isStill?: boolean;
  isFigure?: boolean;
}
