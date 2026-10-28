import type { BugCatchKind } from './BugCatchKind';
import type { IBug } from './IBug';

/** Os bugs depois que uma falha ou um achado chegou, e o bug em que ele caiu. */
export interface IBugCatch {
  bugs: IBug[];
  bugId: string;
  how: BugCatchKind;
}
