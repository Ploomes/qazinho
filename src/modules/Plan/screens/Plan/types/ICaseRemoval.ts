import type { ITestCase } from '@/modules/Plan/types';

/**
 * A case the QA just removed, with the plan before and after it, so it can come back
 * while nothing else changed.
 */
export interface ICaseRemoval {
  key: string;
  workspaceId: string;
  caseId: string;
  before: ITestCase[];
  after: ITestCase[];
}
