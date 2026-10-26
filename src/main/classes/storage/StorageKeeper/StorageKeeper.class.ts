import type { IStorageKeeper } from './types';
import type { IRemovedVideo, IRunRef, IStorageUsage, IVideoSweep } from '@/shared/types';
import { readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { ARCHIVE } from '@/main/classes/storage/Archive/constants';
import { isInside } from '@/main/classes/storage/Archive/library';
import { STORAGE_KEEPER } from './constants';
import { filesUnder, runFileKindOf } from './library';

/** What QAzinho keeps on this computer, by kind, and the runs' videos it lets go of once they are old; the reports and screens stay. */
export class StorageKeeper {
  private readonly dataRoot: string;
  private readonly runsRoot: string;
  private readonly buildsRoot: string;
  private readonly now: () => Date;

  public constructor(props: IStorageKeeper) {
    this.dataRoot = props.dataRoot;
    this.runsRoot = join(props.dataRoot, ARCHIVE.runs);
    this.buildsRoot = props.buildsRoot;
    this.now = props.now;
  }

  /** The bytes QAzinho's folder holds: the runs' videos and screens, the apps it built, and the rest. */
  public async usage(): Promise<IStorageUsage> {
    const usage = { videos: 0, screens: 0, builds: 0, total: 0 };

    for (const file of await filesUnder(this.dataRoot)) {
      usage.total += file.size;
      if (isInside({ root: this.buildsRoot, file: file.path })) {
        usage.builds += file.size;
        continue;
      }
      if (!isInside({ root: this.runsRoot, file: file.path })) continue;

      const kind = runFileKindOf(basename(file.path));
      if (kind === 'video') usage.videos += file.size;
      if (kind === 'screen') usage.screens += file.size;
    }

    return {
      ...usage,
      other: usage.total - usage.videos - usage.screens - usage.builds,
    };
  }

  /** Deletes each run's video recorded more than so many days ago, and notes where it was. */
  public async sweepVideos(props: { olderThanDays: number }): Promise<IVideoSweep> {
    const now = this.now();
    const cutoff = now.getTime() - props.olderThanDays * STORAGE_KEEPER.dayMs;
    const sweep = { removed: 0, freedBytes: 0 };

    for (const ref of await this.runRefs()) {
      for (const name of Object.values(ARCHIVE.videos)) {
        const file = join(this.runsRoot, ref.workspaceId, ref.runId, name);
        const info = await stat(file).catch(() => null);
        if (info?.isFile() !== true || info.mtime.getTime() >= cutoff) continue;

        await rm(file, { force: true });
        await writeFile(
          join(this.runsRoot, ref.workspaceId, ref.runId, ARCHIVE.videoRemoved),
          JSON.stringify({
            removedAt: now.toISOString(),
            afterDays: props.olderThanDays,
          }),
        );
        sweep.removed += 1;
        sweep.freedBytes += info.size;
      }
    }

    return sweep;
  }

  /** When, and after how many days, a run's video was let go of; null for one that never was. */
  public async removedVideoOf(ref: IRunRef): Promise<IRemovedVideo | null> {
    const file = join(this.runsRoot, ref.workspaceId, ref.runId, ARCHIVE.videoRemoved);
    if (!isInside({ root: this.runsRoot, file })) return null;

    const noted: unknown = JSON.parse(
      (await readFile(file, 'utf8').catch(() => null)) ?? 'null',
    );
    const { removedAt, afterDays } = (noted ?? {}) as Record<string, unknown>;

    return typeof removedAt === 'string' && typeof afterDays === 'number'
      ? { removedAt, afterDays }
      : null;
  }

  private async runRefs(): Promise<IRunRef[]> {
    const refs: IRunRef[] = [];

    for (const workspace of await readdir(this.runsRoot, { withFileTypes: true }).catch(
      () => [],
    )) {
      if (!workspace.isDirectory() || !ARCHIVE.workspaceId.test(workspace.name)) continue;
      for (const run of await readdir(join(this.runsRoot, workspace.name), {
        withFileTypes: true,
      }).catch(() => [])) {
        if (run.isDirectory())
          refs.push({ workspaceId: workspace.name, runId: run.name });
      }
    }

    return refs;
  }
}
