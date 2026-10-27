import type { IVariableBrief } from '@/shared/types';

/** Variables someone asked the QA to type in the window, for which project and why. */
export interface IVariablesRequest {
  id: string;
  projectId: string;
  drafts: IVariableBrief[];
  by?: 'agent' | 'plan' | 'org';
}
