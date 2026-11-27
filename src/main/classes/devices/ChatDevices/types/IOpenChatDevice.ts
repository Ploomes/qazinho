import type { IDeviceDriver } from '@ploomes/qazinho-harness/engine';

/** O navegador aberto do chat de um workspace e o que a aba Dispositivo mostra dele. */
export interface IOpenChatDevice {
  driver: IDeviceDriver;
  url: string;
  streamUrl: string | null;
  address: string | null;
  timer: ReturnType<typeof setTimeout> | null;
}
