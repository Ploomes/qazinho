import type { IShot } from './IShot';
import type { IActionMotion, IDeviceImage, IStepAction } from '@/shared/types';

/** What a run needs from a device, whether it is a browser or a phone. */
export interface IDeviceDriver {
  open: () => Promise<void>;
  act: (action: IStepAction) => Promise<void>;
  describe: () => Promise<string>;
  glance: () => Promise<IDeviceImage | null>;
  motion: () => Promise<IActionMotion | null>;
  shoot: (file: string) => Promise<IShot | null>;
  stream: (onFrame: (jpeg: Buffer) => void) => Promise<boolean>;
  close: () => Promise<void>;
}
