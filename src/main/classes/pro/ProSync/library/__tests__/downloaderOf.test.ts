import { mkdtemp, readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { downloaderOf } from '@/main/classes/pro/ProSync/library';

const folder = () => mkdtemp(join(tmpdir(), 'qazinho-download-'));
const bodyOf = (text: string) => new Response(text).body as ReadableStream<Uint8Array>;

describe('downloaderOf', () => {
  it('writes the file where asked, making its folder', async () => {
    const root = await folder();
    const file = join(root, 'aaa', 'nota.pdf');
    const isOk = await downloaderOf(() =>
      Promise.resolve({ ok: true, body: bodyOf('pdf') }),
    )({ url: 'https://x', headers: {}, file });

    expect(isOk).toBe(true);
    expect(await readFile(file, 'utf8')).toBe('pdf');
  });

  it('says false when the platform does not have it', async () => {
    const root = await folder();

    expect(
      await downloaderOf(() => Promise.resolve({ ok: false, body: null }))({
        url: 'https://x',
        headers: {},
        file: join(root, 'nota.pdf'),
      }),
    ).toBe(false);
  });

  /** Meio arquivo com o nome certo seria subido como se fosse o arquivo inteiro. */
  it('leaves nothing behind when the download breaks halfway', async () => {
    const root = await folder();
    const broken = new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.enqueue(new Uint8Array([1]));
        controller.error(new Error('cut'));
      },
    });

    expect(
      await downloaderOf(() => Promise.resolve({ ok: true, body: broken }))({
        url: 'https://x',
        headers: {},
        file: join(root, 'nota.pdf'),
      }),
    ).toBe(false);
    expect(await readdir(root)).toEqual([]);
  });
});
