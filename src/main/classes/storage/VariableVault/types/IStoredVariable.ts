import type { IVariableValue } from '@/main/types';

/**
 * Uma variável como fica no disco, lacrada: o projeto a que pertence, o nome, o que
 * guarda, o valor e se é segredo, o que ela é quando não diz.
 */
export interface IStoredVariable extends IVariableValue {
  projectId: string;
  isSecret?: boolean;
}
