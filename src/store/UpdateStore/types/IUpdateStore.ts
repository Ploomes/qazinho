import type { AppUpdate } from '@/shared/types';

/** Em que pé a atualização do app está, como a main contou por último. */
export interface IUpdateStore {
  update: AppUpdate;
  setUpdate: (update: AppUpdate) => void;
}
