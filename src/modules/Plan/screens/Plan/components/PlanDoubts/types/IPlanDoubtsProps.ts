import type { ITestCase } from '@/modules/Plan/types';
import type { IIssue } from '@/modules/Workspace/types';
import type { IPlanDoubt } from '@/shared/types';

/** As dúvidas de um plano, a história a que elas vão e os casos que esperam por elas. */
export interface IPlanDoubtsProps {
  workspaceId: string;
  doubts: IPlanDoubt[];
  issue: IIssue | null;
  plan: ITestCase[];
  isLocked: boolean;
}
