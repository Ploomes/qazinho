import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { fileFactsOf } from '@/main/classes/pro/ProSync/library';

describe('fileFactsOf', () => {
  it('reads a file’s size and sha256', async () => {
    const file = join(await mkdtemp(join(tmpdir(), 'qazinho-facts-')), 'shot.jpg');
    await writeFile(file, 'abc');

    expect(await fileFactsOf(file)).toEqual({
      size: 3,
      sha256: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    });
  });

  it('says nothing for a file that is gone', async () => {
    expect(await fileFactsOf(join(tmpdir(), 'qazinho-none', 'gone.jpg'))).toBeNull();
  });
});
