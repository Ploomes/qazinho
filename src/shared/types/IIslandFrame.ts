import type { IIsland } from './IIsland';

/** O que a janela da ilha recebe: o que mostrar, e o tamanho do notch que ela veste. */
export interface IIslandFrame {
  island: IIsland;
  barHeight: number;
  notchWidth: number;
}
