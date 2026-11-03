import type { IDeviceOffEnded } from './IDeviceOffEnded';

/** O que a tela vazia do dispositivo diz, e o que oferece da última run quando há uma. */
export interface IDeviceOffProps {
  title: string;
  ended: IDeviceOffEnded | null;
}
