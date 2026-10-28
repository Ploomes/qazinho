import type { IStorageUsage, IVideoSweep } from '@/shared/types';

/**
 * O único que chama o lado do armazenamento da bridge: o que o QAzinho guarda neste
 * computador, e soltar os vídeos de runs antigas.
 */
export class Storage {
  public static async usage(): Promise<IStorageUsage | null> {
    return (await window.qazinho?.storageUsage()) ?? null;
  }

  /**
   * Apaga os vídeos das runs gravadas há mais de tantos dias; os relatórios e as telas
   * delas ficam.
   */
  public static async sweepVideos(olderThanDays: number): Promise<IVideoSweep> {
    return (
      (await window.qazinho?.sweepVideos(olderThanDays)) ?? { removed: 0, freedBytes: 0 }
    );
  }
}
