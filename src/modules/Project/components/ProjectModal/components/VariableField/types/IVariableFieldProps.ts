import type { IVariableDraft } from '@/modules/Project/types';
import type { IVariableBrief } from '@/shared/types';

export interface IVariableFieldProps {
  variables: IVariableDraft[];
  saved: IVariableBrief[];
  onChange: (variables: IVariableDraft[]) => void;
}
