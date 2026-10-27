import type { IStorageUsage, IVideoSweep } from '@/shared/types';

/**
 * The only caller of the storage side of the bridge: what QAzinho keeps on this computer,
 * and letting old run videos go.
 */
export class Storage {
  public static async usage(): Promise<IStorageUsage | null> {
    return (await window.qazinho?.storageUsage()) ?? null;
  }

  /**
   * Deletes the videos of runs recorded more than so many days ago; their reports and
   * screens stay.
   */
  public static async sweepVideos(olderThanDays: number): Promise<IVideoSweep> {
    return (
      (await window.qazinho?.sweepVideos(olderThanDays)) ?? { removed: 0, freedBytes: 0 }
    );
  }
}
