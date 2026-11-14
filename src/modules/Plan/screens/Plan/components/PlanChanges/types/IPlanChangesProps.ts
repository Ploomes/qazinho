import type { IChangeReview, IPendingChange, ITestCase } from '@/modules/Plan/types';
import type { IIssue } from '@/modules/Workspace/types';
import type { IPlanDoubt } from '@/shared/types';
import type { ReactNode } from 'react';

/**
 * O que mudou nas fontes de um plano e a revisão das trocas: o plano, as dúvidas, a
 * história, se há fonte a conferir, e o que o plano manda para fora, na mesma barra.
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
  actions: ReactNode;
}
