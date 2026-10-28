import type { IDetectedAgent } from './IDetectedAgent';
import type { IDeviceTools } from './IDeviceTools';
import type { IToolStatus } from './IToolStatus';

/**
 * Uma olhada nova na máquina, com os gerenciadores de pacote de que uma instalação
 * precisa.
 */
export interface IMachineCheck {
  agents: IDetectedAgent[];
  tools: IDeviceTools;
  managers: { npm: IToolStatus; brew: IToolStatus };
}
