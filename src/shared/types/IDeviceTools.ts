import type { IToolStatus } from './IToolStatus';

/**
 * O que um alvo de dispositivo precisa nesta máquina. O QAzinho os acha; nunca os
 * instala.
 */
export interface IDeviceTools {
  androidSdk: IToolStatus;
  xcode: IToolStatus;
  idb: IToolStatus;
}
