import type { IVariableBrief } from '@/shared/types';

/** Variables someone asked the QA to type in the window: the project they go to, the names and descriptions proposed, and whether an agent asked or the plan names them. */
export interface IVariablesRequest {
  id: string;
  projectId: string;
  drafts: IVariableBrief[];
  by?: 'agent' | 'plan';
}
