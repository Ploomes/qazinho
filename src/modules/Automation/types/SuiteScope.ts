/**
 * What the QA asked to run: the whole suite, everything under a folder or in a file, or
 * some tests by their id.
 */
export type SuiteScope =
  { kind: 'all' } | { kind: 'path'; path: string } | { kind: 'tests'; testIds: string[] };
