import type { FilingStep } from './FilingStep';

/** Um passo de mandar um bug como a main o dá, para o registro a que pertence. */
export interface IFilingEvent {
  filingId: string;
  step: FilingStep;
  state: 'working' | 'done' | 'failed';
}
