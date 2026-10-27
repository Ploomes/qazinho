import type { ISuiteTest } from '@/shared/types';

/**
 * A spec file of a suite on screen: where it is, its name, and its tests in the order
 * they are written.
 */
export interface ISuiteFile {
  path: string;
  name: string;
  tests: ISuiteTest[];
}
