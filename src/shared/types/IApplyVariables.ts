import type { VariableChange } from './VariableChange';

/** Changes to one project's variables, kept together or not at all. */
export interface IApplyVariables {
  projectId: string;
  changes: VariableChange[];
}
