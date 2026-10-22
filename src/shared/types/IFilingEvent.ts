import type { FilingStep } from './FilingStep';

/** One step of sending a bug as main takes it, for the filing it belongs to. */
export interface IFilingEvent {
  filingId: string;
  step: FilingStep;
  state: 'working' | 'done' | 'failed';
}
