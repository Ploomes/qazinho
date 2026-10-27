import type { ISuiteFile } from './ISuiteFile';

/**
 * A folder of a suite on screen, such as one story's tests: where it is, its name, and
 * its spec files.
 */
export interface ISuiteFolder {
  path: string;
  name: string;
  files: ISuiteFile[];
}
