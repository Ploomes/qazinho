import type { InstallableId } from './InstallableId';

/**
 * Uma linha de uma instalação enquanto acontece: qual comando de quantos, e o que
 * imprimiu por último.
 */
export interface ISetupEvent {
  item: InstallableId;
  stage: number;
  stages: number;
  line: string;
}
