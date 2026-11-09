import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { uploadPathOf } from '@/main/classes/runs/RunCoordinator/library';

const folder = () => mkdtemp(join(tmpdir(), 'qazinho-upload-path-'));
const SHA = createHash('sha256').update('pdf').digest('hex');

async function world(canUpload = true) {
  const root = await folder();
  const store = join(root, 'files');
  const refs = new Map<string, string>();
  const original = join(root, 'nota.pdf');

  await writeFile(original, 'pdf');

  return {
    root,
    store,
    refs,
    original,
    path: uploadPathOf({ canUpload: () => canUpload, attachments: [], store, refs }),
  };
}

describe('uploadPathOf', () => {
  it('refuses a file nobody gave the run, and keeps nothing of it', async () => {
    const { path, refs } = await world(false);

    expect(await path('/qa/.ssh/id_rsa')).toBeNull();
    expect(refs.size).toBe(0);
  });

  /** A gravação precisa valer em outra máquina: o caminho desta não serve lá. */
  it('keeps a file of the plan by its content, and says how a recording names it', async () => {
    const { path, refs, store, original } = await world();
    const kept = await path(original);

    expect(kept).toBe(join(store, SHA, 'nota.pdf'));
    expect(await readFile(kept ?? '', 'utf8')).toBe('pdf');
    expect(refs.get(original)).toBe(`${SHA}/nota.pdf`);
  });

  it('finds what a recording names', async () => {
    const { path, store } = await world();

    await mkdir(join(store, SHA), { recursive: true });
    await writeFile(join(store, SHA, 'nota.pdf'), 'pdf');

    expect(await path(`${SHA}/nota.pdf`)).toBe(join(store, SHA, 'nota.pdf'));
  });

  it('has nothing for a recording whose file this machine does not hold', async () => {
    const { path } = await world();

    expect(await path(`${SHA}/nota.pdf`)).toBeNull();
  });

  it('keeps an attachment under the name the QA gave it, not the one on disk', async () => {
    const root = await folder();
    const stored = join(root, 'ab12cd34-nota.pdf');
    const refs = new Map<string, string>();

    await writeFile(stored, 'pdf');

    const kept = await uploadPathOf({
      canUpload: () => true,
      attachments: [{ name: 'nota.pdf', path: stored }],
      store: join(root, 'files'),
      refs,
    })(stored);

    expect(kept).toBe(join(root, 'files', SHA, 'nota.pdf'));
    expect(refs.get(stored)).toBe(`${SHA}/nota.pdf`);
  });

  it('lets a file that is not there fail in the words of the device', async () => {
    const { path, refs } = await world();

    expect(await path('/qa/sumiu.pdf')).toBe('/qa/sumiu.pdf');
    expect(refs.size).toBe(0);
  });
});
