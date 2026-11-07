import type { IVariableDraft } from '@/modules/Project/types';
import type { IVariableBrief } from '@/shared/types';

export interface IVariableFieldProps {
  projectId: string | null;
  variables: IVariableDraft[];
  saved: IVariableBrief[];
  onChange: (variables: IVariableDraft[]) => void;
}
