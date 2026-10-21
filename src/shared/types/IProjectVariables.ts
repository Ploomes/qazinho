import type { IVariableBrief } from './IVariableBrief';

/** The variables one project keeps, by name and description. */
export interface IProjectVariables {
  projectId: string;
  variables: IVariableBrief[];
}
