import type { IIslandAction, IIslandFrame } from '@/shared/types';

/** O lado da bridge da janela da ilha: o que mostrar, o mouse e o que o QA pede. */
export class IslandView {
  public static onFrame(listener: (frame: IIslandFrame) => void): () => void {
    return window.qazinhoIsland.onFrame(listener);
  }

  public static hover(isOver: boolean): void {
    window.qazinhoIsland.hover(isOver);
  }

  public static act(action: IIslandAction): void {
    window.qazinhoIsland.act(action);
  }
}
