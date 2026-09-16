import type { IAskOption } from './IAskOption';

/** The agent stopped and needs the QA; the run holds until one option is picked. */
export interface IAskMessage {
  id: string;
  kind: 'ask';
  at: string;
  text: string;
  options: IAskOption[];
  holdingFor: string;
}
