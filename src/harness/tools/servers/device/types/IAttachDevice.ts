import type { IDevicePort } from './IDevicePort';
import type { IStepFinding } from './IStepFinding';
import type { IStepReport } from './IStepReport';

/** A workspace's device for the length of a run, and who hears the steps its agent reports and the bugs it files. */
export interface IAttachDevice {
  workspaceId: string;
  driver: IDevicePort;
  onReport?: (report: IStepReport) => Promise<string>;
  onFinding?: (finding: IStepFinding) => Promise<string>;
}
