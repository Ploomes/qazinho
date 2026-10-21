import type { IVariableValue } from '@/main/types';

/** A variable as it sits on disk, sealed: the project it belongs to, its name, what it holds and its value. */
export interface IStoredVariable extends IVariableValue {
  projectId: string;
}
