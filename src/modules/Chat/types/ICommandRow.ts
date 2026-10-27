/**
 * One choice the command picker offers: what it is called, a word beside it, a line under
 * it, and whether it can be picked.
 */
export interface ICommandRow {
  id: string;
  label: string;
  tag: string | null;
  detail: string | null;
  isDisabled: boolean;
}
