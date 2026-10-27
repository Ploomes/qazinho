import type { IToolStatus } from './IToolStatus';

/**
 * What a device target needs on this machine. QAzinho finds them; it never installs them.
 */
export interface IDeviceTools {
  androidSdk: IToolStatus;
  xcode: IToolStatus;
  idb: IToolStatus;
}
