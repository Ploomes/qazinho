import type { IVariablesRequest } from './IVariablesRequest';
import type { IProjectVariables, IVariableBrief } from '@/shared/types';

/** Each project's variables by name and description, and the window asking the QA for values: what it asked, and how the last one ended, null when closed without saving. */
export interface IVariablesStore {
  byProject: Record<string, IVariableBrief[]>;
  request: IVariablesRequest | null;
  settled: { id: string; saved: string[] | null } | null;
  load: (projects: IProjectVariables[]) => void;
  land: (props: { projectId: string; variables: IVariableBrief[] }) => void;
  drop: (projectId: string) => void;
  ask: (request: IVariablesRequest) => void;
  settle: (props: { id: string; saved: string[] | null }) => void;
}
