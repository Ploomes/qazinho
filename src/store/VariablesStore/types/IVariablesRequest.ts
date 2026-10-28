import type { IVariableBrief } from '@/shared/types';

/**
 * Variáveis que alguém pediu ao QA para digitar na janela, para qual projeto e por quê.
 */
export interface IVariablesRequest {
  id: string;
  projectId: string;
  drafts: IVariableBrief[];
  by?: 'agent' | 'plan' | 'org';
}
