import type { IStepReport } from './IStepReport';
import type { IDeviceDriver } from '@/main/classes/devices/types';

/** A workspace's device for the length of a run, and who hears the steps its agent reports. */
export interface IAttachDevice {
  workspaceId: string;
  driver: IDeviceDriver;
  onReport?: (report: IStepReport) => Promise<string>;
}
