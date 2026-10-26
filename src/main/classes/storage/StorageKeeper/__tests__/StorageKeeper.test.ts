import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { StorageKeeper } from '@/main/classes/storage/StorageKeeper';

const NOW = new Date('2026-10-26T12:00:00.000Z');
const DAY_MS = 86_400_000;

let root: string;
let keeper: StorageKeeper;

async function put({
  path,
  bytes,
  daysOld = 0,
}: {
  path: string;
  bytes: number;
  daysOld?: number;
}): Promise<string> {
  const file = join(root, path);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, Buffer.alloc(bytes));
  const at = new Date(NOW.getTime() - daysOld * DAY_MS);
  await utimes(file, at, at);

  return file;
}

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'qazinho-storage-'));
  keeper = new StorageKeeper({
    dataRoot: root,
    buildsRoot: join(root, 'builds'),
    now: () => NOW,
  });
});

describe('StorageKeeper', () => {
  it("counts the runs' videos and screens, the apps built and the rest apart", async () => {
    await put({ path: 'runs/w1/r1/run.mp4', bytes: 4000 });
    await put({ path: 'runs/w1/r1/step-1.jpg', bytes: 300 });
    await put({ path: 'runs/w1/r1/network.json', bytes: 50 });
    await put({ path: 'runs/w2/r1/run.webm', bytes: 2000 });
    await put({ path: 'builds/apps/p1/loja.apk', bytes: 1000 });
    await put({ path: 'workspaces/w1/workspace.json', bytes: 70 });

    expect(await keeper.usage()).toEqual({
      videos: 6000,
      screens: 300,
      builds: 1000,
      other: 120,
      total: 7420,
    });
  });

  it('lets go of the videos older than the days given, keeps the rest, and notes it', async () => {
    const old = await put({ path: 'runs/w1/r1/run.mp4', bytes: 4000, daysOld: 31 });
    const fresh = await put({ path: 'runs/w1/r2/run.mp4', bytes: 3000, daysOld: 2 });
    const screen = await put({ path: 'runs/w1/r1/step-1.jpg', bytes: 300, daysOld: 31 });

    expect(await keeper.sweepVideos({ olderThanDays: 30 })).toEqual({
      removed: 1,
      freedBytes: 4000,
    });
    expect(existsSync(old)).toBe(false);
    expect(existsSync(fresh)).toBe(true);
    expect(existsSync(screen)).toBe(true);
    expect(await keeper.removedVideoOf({ workspaceId: 'w1', runId: 'r1' })).toEqual({
      removedAt: NOW.toISOString(),
      afterDays: 30,
    });
    expect(await keeper.removedVideoOf({ workspaceId: 'w1', runId: 'r2' })).toBeNull();
  });

  it('frees nothing the second time, nor where there are no runs', async () => {
    await put({ path: 'runs/w1/r1/run.webm', bytes: 4000, daysOld: 40 });

    await keeper.sweepVideos({ olderThanDays: 7 });

    expect(await keeper.sweepVideos({ olderThanDays: 7 })).toEqual({
      removed: 0,
      freedBytes: 0,
    });
    expect(
      await new StorageKeeper({
        dataRoot: join(root, 'nothing'),
        buildsRoot: join(root, 'nothing', 'builds'),
        now: () => NOW,
      }).sweepVideos({ olderThanDays: 7 }),
    ).toEqual({ removed: 0, freedBytes: 0 });
  });

  it('reads no note from outside the runs', async () => {
    await put({ path: 'video-removed.json', bytes: 10 });

    expect(await keeper.removedVideoOf({ workspaceId: '..', runId: '..' })).toBeNull();
  });
});
