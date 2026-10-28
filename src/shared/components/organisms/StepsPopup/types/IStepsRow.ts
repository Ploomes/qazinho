import type { StepRowState } from './StepRowState';

/** Um passo que o popup lista, em palavras, com em que pé está. */
export interface IStepsRow {
  key: string;
  label: string;
  state: StepRowState;
}
