import type { ISuiteResult } from '@/shared/types';

/** How one test went in a run the agent asked for, with what Playwright noted of its failure and where its screenshots are. */
export interface ICheckedTest {
  result: ISuiteResult;
  notes: string;
  screenshots: string[];
}
