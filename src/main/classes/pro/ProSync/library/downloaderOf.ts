import type { ProDownloader } from '@/main/classes/pro/ProSync/types';
import { createWriteStream } from 'node:fs';
import { mkdir, rename, rm } from 'node:fs/promises';
import { dirname } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

type DownloadFetcher = (
  url: string,
  init: { method: 'GET'; headers: Record<string, string> },
) => Promise<{ ok: boolean; body: ReadableStream<Uint8Array> | null }>;

/**
 * Um download que escreve o arquivo no disco aos poucos e só o põe no lugar inteiro, para
 * uma queda de rede nunca deixar meio arquivo com cara de arquivo.
 */
export function downloaderOf(fetcher: DownloadFetcher): ProDownloader {
  return async ({ url, headers, file }) => {
    const part = `${file}.part`;

    try {
      const response = await fetcher(url, { method: 'GET', headers });

      if (!response.ok || response.body === null) return false;

      await mkdir(dirname(file), { recursive: true });
      await pipeline(
        Readable.fromWeb(response.body as Parameters<typeof Readable.fromWeb>[0]),
        createWriteStream(part),
      );
      await rename(part, file);

      return true;
    } catch {
      await rm(part, { force: true }).catch(() => undefined);

      return false;
    }
  };
}
