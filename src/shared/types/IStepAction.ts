import type { DialogAnswer } from './DialogAnswer';

/** One thing to do on the device, as the agent asked for it; `locator` and `option` keep how a web run found its target, for code that does it again. */
export interface IStepAction {
  kind: 'goto' | 'reopen' | 'click' | 'fill' | 'press' | 'wait';
  target: string;
  value: string;
  dialog?: DialogAnswer;
  promptText?: string;
  locator?: string;
  option?: string;
}
