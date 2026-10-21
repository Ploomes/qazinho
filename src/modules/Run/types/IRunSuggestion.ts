import type { IDraftedCase } from '@/shared/types';

/** The plan an exploration suggested: what the explorer said of the app, and the cases it would test. */
export interface IRunSuggestion {
  summary: string;
  cases: IDraftedCase[];
}
