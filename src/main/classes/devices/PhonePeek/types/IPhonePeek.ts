import type { IPhoneTarget } from './IPhoneTarget';
import type { IDeviceDriver } from '@salve-software/qazinho-harness/engine';

/**
 * O que o PhonePeek precisa: um driver para o app no emulador ou simulador desta máquina,
 * se uma run segura esse dispositivo agora, e um relógio.
 */
export interface IPhonePeek {
  openDevice: (target: IPhoneTarget) => Promise<IDeviceDriver | null>;
  isBusy: (kind: IPhoneTarget['kind']) => boolean;
  now?: () => number;
}
