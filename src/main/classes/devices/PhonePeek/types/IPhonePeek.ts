import type { IPhoneTarget } from './IPhoneTarget';
import type { IDeviceDriver } from '@/main/classes/devices/types';

/** What PhonePeek needs: a driver for the app on this machine's emulator or simulator, whether a run holds that device now, and a clock. */
export interface IPhonePeek {
  openDevice: (target: IPhoneTarget) => Promise<IDeviceDriver | null>;
  isBusy: (kind: IPhoneTarget['kind']) => boolean;
  now?: () => number;
}
