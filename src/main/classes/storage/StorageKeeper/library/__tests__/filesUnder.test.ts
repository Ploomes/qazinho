import { mkdir, mkdtemp, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { filesUnder } from '@/main/classes/storage/StorageKeeper/library';

describe('filesUnder', () => {
  it('finds every file under a folder with its size, and follows no link', async () => {
    const root = await mkdtemp(join(tmpdir(), 'qazinho-files-'));
    await mkdir(join(root, 'a', 'b'), { recursive: true });
    await writeFile(join(root, 'top.txt'), 'xx');
    await writeFile(join(root, 'a', 'b', 'deep.bin'), Buffer.alloc(10));
    await symlink(join(root, 'top.txt'), join(root, 'a', 'link.txt')).catch(
      () => undefined,
    );

    const found = await filesUnder(root);

    expect(
      found.map(({ path, size }) => [path.slice(root.length + 1), size]).sort(),
    ).toEqual([
      [join('a', 'b', 'deep.bin'), 10],
      ['top.txt', 2],
    ]);
  });

  it('finds nothing under a folder that is not there', async () => {
    expect(await filesUnder(join(tmpdir(), 'qazinho-nowhere-at-all'))).toEqual([]);
  });
});
