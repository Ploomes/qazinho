import type { IslandAction, IIslandFrame } from '@/shared/types';

/** A bridge da janela da ilha: o que mostrar, o mouse, o teclado e o pedido do QA. */
export class IslandView {
  public static onFrame(listener: (frame: IIslandFrame) => void): () => void {
    return window.qazinhoIsland.onFrame(listener);
  }

  public static hover(isOver: boolean): void {
    window.qazinhoIsland.hover(isOver);
  }

  public static keyboard(isWanted: boolean): void {
    window.qazinhoIsland.keyboard(isWanted);
  }

  public static act(action: IslandAction): void {
    window.qazinhoIsland.act(action);
  }
}
