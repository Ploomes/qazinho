import type { IDeviceOffEnded } from './IDeviceOffEnded';
import type { IDeviceOffStart } from './IDeviceOffStart';
import type { InternMood } from '@/shared/components/atoms/Intern/types';

/** O que a tela vazia do dispositivo diz, e o que oferece: a primeira run ou a última. */
export interface IDeviceOffProps {
  title: string;
  detail: string;
  mood: InternMood;
  ended: IDeviceOffEnded | null;
  start: IDeviceOffStart | null;
  shot?: {
    label: string;
    src: string | null;
    file: string | null;
    onOpen: () => void;
  } | null;
}
