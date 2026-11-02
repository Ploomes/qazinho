import type { IIsland, IslandAction } from '@/shared/types';

/**
 * O único que chama o lado da ilha da bridge da página principal: o que a ilha mostra, e
 * o que o QA pediu nela.
 */
export class Island {
  public static set(island: IIsland): void {
    window.qazinho?.setIsland(island);
  }

  public static onAction(listener: (action: IslandAction) => void): () => void {
    return window.qazinho?.onIslandAction(listener) ?? (() => undefined);
  }
}
