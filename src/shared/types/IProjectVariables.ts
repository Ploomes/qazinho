import type { IVariableBrief } from './IVariableBrief';

/** As variáveis que um projeto guarda, por nome e descrição. */
export interface IProjectVariables {
  projectId: string;
  variables: IVariableBrief[];
}
