/**
 * A screen that goes with a bug: the one before, the one that broke, or the one a later
 * run caught, with the run it came from.
 */
export interface IFilingShot {
  kind: 'before' | 'broke' | 'again';
  run: string | null;
  file: string | null;
  src: string | null;
}
