import type { IScreenThumb } from '@/modules/Device/types';

/** As telas abertas numa run, para o QA ver qualquer uma sem mexer no agente. */
export interface IScreenRailProps {
  label: string;
  screens: IScreenThumb[];
  onPick: (id: number) => void;
}
