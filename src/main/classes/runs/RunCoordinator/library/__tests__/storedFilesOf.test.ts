import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { storedFilesOf } from '@/main/classes/runs/RunCoordinator/library';

describe('storedFilesOf', () => {
  it('lists each file of the plan, and nothing still arriving', async () => {
    const store = await mkdtemp(join(tmpdir(), 'qazinho-stored-'));

    await mkdir(join(store, 'aaa'));
    await writeFile(join(store, 'aaa', 'nota.pdf'), 'x');
    await writeFile(join(store, 'aaa', 'capa.html.part'), 'x');

    expect(await storedFilesOf(store)).toEqual([
      { name: 'nota.pdf', path: join(store, 'aaa', 'nota.pdf') },
    ]);
  });

  it('is empty for a plan with no files', async () => {
    expect(await storedFilesOf('/does/not/exist')).toEqual([]);
  });
});
