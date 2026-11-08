import type { IKeepMemories, MemoryKeeping } from '@/shared/types';

/** O único que chama o lado das memórias da bridge. */
export class Memories {
  public static async keep(request: IKeepMemories): Promise<MemoryKeeping> {
    return (await window.qazinho?.keepMemories(request)) ?? { isKept: false };
  }
}
