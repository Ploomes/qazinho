import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { Archive } from '@/main/classes/storage/Archive';

let root: string;
let archive: Archive;

const SAVED = {
  id: 'w1',
  json: '{ "id": "w1", "name": "Checkout regression" }',
  planYaml: 'cases:\n  - id: TC-01\n',
};

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'qazinho-archive-'));
  archive = new Archive(root);
});

describe('Archive', () => {
  it('a machine that has never run QAzinho has no projects and no workspaces', async () => {
    expect(await archive.read()).toEqual({ projects: '[]', workspaces: [] });
  });

  it('reads back exactly what it wrote', async () => {
    await archive.saveProjects('[{"id":"p1"}]');
    await archive.saveWorkspace(SAVED);

    expect(await archive.read()).toEqual({
      projects: '[{"id":"p1"}]',
      workspaces: [SAVED],
    });
  });

  it('writes the plan as its own file, so a QA can open it in an editor', async () => {
    await archive.saveWorkspace(SAVED);

    const read = await archive.read();

    expect(read.workspaces[0]?.planYaml).toBe('cases:\n  - id: TC-01\n');
  });

  it('removing a workspace takes its folder with it', async () => {
    await archive.saveWorkspace(SAVED);
    await archive.removeWorkspace('w1');

    expect((await archive.read()).workspaces).toEqual([]);
  });

  it('removing a workspace that was never there is not an error', async () => {
    await expect(archive.removeWorkspace('gone')).resolves.toBeUndefined();
  });

  it('a workspace folder with no workspace file in it is skipped', async () => {
    await archive.saveWorkspace({ ...SAVED, json: '' });

    expect((await archive.read()).workspaces).toEqual([]);
  });

  it('hands a screenshot it wrote back as an image the page can draw', async () => {
    const file = join(root, 'shot.jpg');

    await writeFile(file, Buffer.from([255, 216, 255]));

    expect(await archive.readShot(file)).toBe('data:image/jpeg;base64,/9j/');
  });

  it('refuses a file outside its own folder, however it is asked for', async () => {
    expect(await archive.readShot('/etc/passwd')).toBeNull();
    expect(await archive.readShot(join(root, '..', '..', '.ssh', 'id_rsa'))).toBeNull();
  });

  it('a screenshot that is no longer on disk is nothing, not a crash', async () => {
    expect(await archive.readShot(join(root, 'gone.jpg'))).toBeNull();
  });
});
