import type { IDetectedAgent } from './IDetectedAgent';
import type { IDeviceTools } from './IDeviceTools';
import type { IToolStatus } from './IToolStatus';

/** A fresh look at the machine, with the package managers an install needs. */
export interface IMachineCheck {
  agents: IDetectedAgent[];
  tools: IDeviceTools;
  managers: { npm: IToolStatus; brew: IToolStatus };
}
