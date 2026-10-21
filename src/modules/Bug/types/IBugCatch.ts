import type { BugCatchKind } from './BugCatchKind';
import type { IBug } from './IBug';

/** The bugs once a failure or a finding came in, and the bug it landed on. */
export interface IBugCatch {
  bugs: IBug[];
  bugId: string;
  how: BugCatchKind;
}
