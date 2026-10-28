import { mkdir, mkdtemp, readdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { writeAtomically } from '@/main/library/writeAtomically';

describe('writeAtomically', () => {
  it('replaces a file whole and leaves no copy behind', async () => {
    const folder = await mkdtemp(join(tmpdir(), 'qazinho-atomic-'));
    const file = join(folder, 'workspace.json');

    await writeFile(file, '{"old":true}');
    await writeAtomically({ file, data: '{"new":true}' });

    expect(await readFile(file, 'utf8')).toBe('{"new":true}');
    expect(await readdir(folder)).toEqual(['workspace.json']);
  });

  it('keeps the last of two saves that race, never a mix', async () => {
    const folder = await mkdtemp(join(tmpdir(), 'qazinho-atomic-'));
    const file = join(folder, 'plan.yaml');

    await Promise.all([
      writeAtomically({ file, data: 'a'.repeat(200_000) }),
      writeAtomically({ file, data: 'b'.repeat(100) }),
    ]);

    expect(['a'.repeat(200_000), 'b'.repeat(100)]).toContain(
      await readFile(file, 'utf8'),
    );
    expect(await readdir(folder)).toEqual(['plan.yaml']);
  });

  /**
   * Uma pasta onde deveria estar o arquivo não pode ser substituída: o salvamento falha e
   * a cópia vai embora.
   */
  it('fails without leaving its copy when the file cannot be replaced', async () => {
    const folder = await mkdtemp(join(tmpdir(), 'qazinho-atomic-'));
    const file = join(folder, 'taken');

    await mkdir(join(file, 'inside'), { recursive: true });

    await expect(writeAtomically({ file, data: 'x' })).rejects.toThrow();
    expect(await readdir(folder)).toEqual(['taken']);
  }, 10_000);
});
