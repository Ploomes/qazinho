import type { IChangeReview, IPendingChange, ITestCase } from '@/modules/Plan/types';
import type { IIssue } from '@/modules/Workspace/types';
import type { IPlanDoubt } from '@/shared/types';

/**
 * O que mudou nas fontes de um plano e a revisão das trocas: o plano, as dúvidas, a
 * história, e se há fonte a conferir.
 */
export interface IPlanChangesProps {
  workspaceId: string;
  plan: ITestCase[];
  doubts: IPlanDoubt[];
  issue: IIssue | null;
  changed: IPendingChange | null;
  review: IChangeReview | null;
  canCheck: boolean;
  isLocked: boolean;
}
