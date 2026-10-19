import type { DialogAnswer } from './DialogAnswer';

/** One thing to do on the device, as the agent asked for it. */
export interface IStepAction {
  kind: 'goto' | 'click' | 'fill' | 'press' | 'wait';
  target: string;
  value: string;
  dialog?: DialogAnswer;
}
