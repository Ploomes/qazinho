import type { IVariableValue } from '@/main/types';

/**
 * Uma variável como fica no disco, lacrada: o projeto a que pertence, o nome, o que
 * guarda e o valor.
 */
export interface IStoredVariable extends IVariableValue {
  projectId: string;
}
