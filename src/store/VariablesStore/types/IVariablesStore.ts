import type { IVariablesRequest } from './IVariablesRequest';
import type { IProjectVariables, IVariableBrief } from '@/shared/types';

/**
 * As variáveis de cada projeto por nome e descrição, e a janela pedindo valores ao QA: o
 * que pediu, e como terminou a última, null quando fechada sem salvar.
 */
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
