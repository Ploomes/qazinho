/** Part of a run that goes through one Playwright project, with the files, folders or file:line of the tests it runs; none runs them all, and an empty project means a config with none. */
export interface ISuiteBatch {
  project: string;
  filters: string[];
}
