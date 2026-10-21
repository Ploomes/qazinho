import type { IVariableBrief } from './IVariableBrief';
import type { VariableFailure } from './VariableFailure';

/** How a change to a project's variables ended: the variables it keeps now, or why nothing changed. */
export type VariablesOutcome =
  | { isSaved: true; variables: IVariableBrief[] }
  | { isSaved: false; failure: VariableFailure };
