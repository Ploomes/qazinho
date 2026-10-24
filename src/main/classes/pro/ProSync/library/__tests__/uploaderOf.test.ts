import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { uploaderOf } from '@/main/classes/pro/ProSync/library';

async function fileWith(text: string): Promise<string> {
  const file = join(await mkdtemp(join(tmpdir(), 'qazinho-upload-')), 'run.mp4');

  await writeFile(file, text);

  return file;
}

describe('uploaderOf', () => {
  it('puts the file’s bytes at the signed address, with its length and the headers it was signed with', async () => {
    const file = await fileWith('frames');
    const seen: { url: string; headers: Record<string, string>; text: string }[] = [];
    const upload = uploaderOf(async (url, init) => {
      seen.push({
        url,
        headers: init.headers,
        text: await new Response(init.body).text(),
      });

      return { ok: true };
    });

    expect(
      await upload({
        url: 'https://r2.test/ev/1',
        headers: { 'content-type': 'video/mp4' },
        file,
      }),
    ).toBe(true);
    expect(seen).toEqual([
      {
        url: 'https://r2.test/ev/1',
        headers: { 'content-type': 'video/mp4', 'content-length': '6' },
        text: 'frames',
      },
    ]);
  });

  it('says the file did not go up when the address refused it', async () => {
    const upload = uploaderOf(() => Promise.resolve({ ok: false }));

    expect(
      await upload({
        url: 'https://r2.test/ev/1',
        headers: {},
        file: await fileWith('x'),
      }),
    ).toBe(false);
  });

  it('says the file did not go up when the network dropped or the file is gone', async () => {
    const dropped = uploaderOf(() => Promise.reject(new Error('offline')));
    const never = uploaderOf(() => Promise.resolve({ ok: true }));

    expect(
      await dropped({ url: 'https://r2.test/1', headers: {}, file: await fileWith('x') }),
    ).toBe(false);
    expect(
      await never({
        url: 'https://r2.test/1',
        headers: {},
        file: join(tmpdir(), 'gone.mp4'),
      }),
    ).toBe(false);
  });
});
