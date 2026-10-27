/**
 * Part of a run that goes through one Playwright project, with the tests it runs; none
 * runs them all.
 */
export interface ISuiteBatch {
  project: string;
  filters: string[];
}
