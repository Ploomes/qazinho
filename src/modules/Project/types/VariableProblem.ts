import type { ParseKeys } from 'i18next';

/**
 * What stops a set of variables from being saved, as the words the QA reads and the name
 * they are about.
 */
export type VariableProblem = { key: ParseKeys; name: string } | null;
