import type { IActionMotion, IDeviceImage, IStepAction } from '@/shared/types';

/** What the device tools need from a device: read and see the screen, act on it, and say how it moved. */
export interface IDevicePort {
  describe: () => Promise<string>;
  glance: () => Promise<IDeviceImage | null>;
  act: (action: IStepAction) => Promise<void>;
  motion: () => Promise<IActionMotion | null>;
}
