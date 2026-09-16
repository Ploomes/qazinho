import type { IToolStatus } from './IToolStatus';

/** What a device target needs on this machine. gocrash finds them; it never installs them. */
export interface IDeviceTools {
  androidSdk: IToolStatus;
  xcode: IToolStatus;
  idb: IToolStatus;
}
