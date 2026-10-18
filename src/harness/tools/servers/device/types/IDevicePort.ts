import type { IStepAction } from '@/shared/types';

/** What the device tools need from a device: read the screen, and carry out one action on it. */
export interface IDevicePort {
  describe: () => Promise<string>;
  act: (action: IStepAction) => Promise<void>;
}
