import type { ICommandRow } from './ICommandRow';

/**
 * What the command picker shows for the step the QA is on: its heading, its choices, a
 * note, and the keys.
 */
export interface ICommandPicker {
  heading: string;
  rows: ICommandRow[];
  note: string | null;
  hint: string;
}
