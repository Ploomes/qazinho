import type { ITestCase } from '@/modules/Plan/types';

/**
 * Um caso que o QA acabou de remover, com o plano antes e depois dele, para poder voltar
 * enquanto nada mais mudou.
 */
export interface ICaseRemoval {
  key: string;
  workspaceId: string;
  caseId: string;
  before: ITestCase[];
  after: ITestCase[];
}
