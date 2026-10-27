import type { ISuite } from './ISuite';

/**
 * How connecting a suite went: the suite read from the folder picked, the QA closing the
 * picker, or a folder with no Playwright suite in it.
 */
export type SuitePick =
  | { kind: 'picked'; suite: ISuite }
  | { kind: 'cancelled' }
  | { kind: 'failed'; reason: 'no-playwright' };
