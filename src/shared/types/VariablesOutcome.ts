import type { IVariableBrief } from './IVariableBrief';
import type { VariableFailure } from './VariableFailure';

/**
 * Como terminou uma mudança nas variáveis de um projeto: as variáveis que ele guarda
 * agora, ou por que nada mudou.
 */
export type VariablesOutcome =
  | { isSaved: true; variables: IVariableBrief[] }
  | { isSaved: false; failure: VariableFailure };
