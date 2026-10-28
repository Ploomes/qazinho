import type { VariableChange } from './VariableChange';

/** Mudanças nas variáveis de um projeto, mantidas juntas ou nenhuma. */
export interface IApplyVariables {
  projectId: string;
  changes: VariableChange[];
}
