import type { IShot } from './IShot';
import type {
  IActionMotion,
  IDeviceImage,
  IRunVideo,
  IStepAction,
  IViewport,
} from '@/shared/types';

/** What a run needs from a device, whether it is a browser or a phone; a browser also says how it found the target of its last action. */
export interface IDeviceDriver {
  open: () => Promise<void>;
  restart: () => Promise<void>;
  act: (action: IStepAction) => Promise<void>;
  describe: () => Promise<string>;
  glance: () => Promise<IDeviceImage | null>;
  motion: () => Promise<IActionMotion | null>;
  resize: (viewport: IViewport) => Promise<void>;
  focus: (isFocused: boolean) => Promise<void>;
  shoot: (file: string) => Promise<IShot | null>;
  stream: (onFrame: (jpeg: Buffer) => void) => Promise<boolean>;
  record: (folder: string) => Promise<boolean>;
  stopRecording: () => Promise<IRunVideo | null>;
  close: () => Promise<void>;
  resolution?: () => {
    locator: string;
    toLocator: string | null;
    option: string | null;
  } | null;
}
