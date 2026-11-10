import type { IDeviceOffEnded } from './IDeviceOffEnded';
import type { InternMood } from '@/shared/components/atoms/Intern/types';

/** O que a tela vazia do dispositivo diz, e o que oferece da última run quando há uma. */
export interface IDeviceOffProps {
  title: string;
  detail: string;
  mood: InternMood;
  ended: IDeviceOffEnded | null;
  shot?: {
    label: string;
    src: string | null;
    file: string | null;
    onOpen: () => void;
  } | null;
}
