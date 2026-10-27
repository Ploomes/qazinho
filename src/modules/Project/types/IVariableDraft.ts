/**
 * A variable as the QA edits it before saving: `from` is the saved name it stands for,
 * null when new, and an empty `value` keeps the saved one.
 */
export interface IVariableDraft {
  key: string;
  name: string;
  description: string;
  value: string;
  from: string | null;
}
