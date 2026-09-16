import type { IDeviceAction } from './IDeviceAction';

/** The rolling log of what the agent did on the device, kept to the last few. */
export interface IActionMessage {
  id: string;
  kind: 'action';
  at: string;
  actions: IDeviceAction[];
}
