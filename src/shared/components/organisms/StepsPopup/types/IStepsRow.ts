import type { StepRowState } from './StepRowState';

/** One step the popup lists, in words, with where it stands. */
export interface IStepsRow {
  key: string;
  label: string;
  state: StepRowState;
}
