import type { IIslandFrame } from './IIslandFrame';
import type { IslandAction } from './IslandAction';

/**
 * O que o preload dá à janela da ilha como `window.qazinhoIsland`: o que mostrar, e o
 * que o QA pediu ali.
 */
export interface IIslandApi {
  onFrame: (listener: (frame: IIslandFrame) => void) => () => void;
  hover: (isOver: boolean) => void;
  keyboard: (isWanted: boolean) => void;
  act: (action: IslandAction) => void;
}
