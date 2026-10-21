import type { IVariableBrief } from '@/shared/types';

/** Variables someone asked the QA to type in the window: the project they go to, and the names and descriptions proposed. */
export interface IVariablesRequest {
  id: string;
  projectId: string;
  drafts: IVariableBrief[];
}
