import type { IBugAppearance } from './IBugAppearance';
import type { IBugShot } from './IBugShot';

/** A later time a bug was caught again, with the screen that showed it. */
export interface IBugSighting extends IBugAppearance {
  shot: IBugShot;
}
