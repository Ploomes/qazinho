import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ReplayServer } from '@/main/classes/storage/ReplayServer';

describe('ReplayServer', () => {
  describe('fileOf', () => {
    it('finds the recording a phone or the recorder left in the run’s folder', async () => {
      const root = await mkdtemp(join(tmpdir(), 'qazinho-replays-'));
      const folder = join(root, 'data', 'runs', 'w-1', 'r-01');

      await mkdir(folder, { recursive: true });
      await writeFile(join(folder, 'run.webm'), 'webm');

      const replays = new ReplayServer({
        dataRoot: join(root, 'data'),
        suitesRoot: root,
      });

      expect(await replays.fileOf({ workspaceId: 'w-1', runId: 'r-01' })).toBe(
        join(folder, 'run.webm'),
      );
      expect(await replays.fileOf({ workspaceId: 'w-1', runId: 'r-02' })).toBeNull();
    });

    /**
     * A página nomeia a run; um nome que sobe para fora da pasta das runs não pode chegar
     * a um arquivo lá.
     */
    it('does NOT find a file outside the runs, whatever the run is called', async () => {
      const root = await mkdtemp(join(tmpdir(), 'qazinho-replays-'));

      await mkdir(join(root, 'data', 'runs'), { recursive: true });
      await writeFile(join(root, 'run.mp4'), 'not a run');

      const replays = new ReplayServer({
        dataRoot: join(root, 'data'),
        suitesRoot: root,
      });

      expect(await replays.fileOf({ workspaceId: '..', runId: '..' })).toBeNull();
    });
  });
});
