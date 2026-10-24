import type { ProUploader } from '@/main/classes/pro/ProSync/types';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { Readable } from 'node:stream';

type UploadFetcher = (
  url: string,
  init: {
    method: 'PUT';
    headers: Record<string, string>;
    body: ReadableStream<Uint8Array>;
    duplex: 'half';
  },
) => Promise<{ ok: boolean }>;

/** An upload that streams a file from disk to the address the platform signed, with its length, so a video never sits whole in memory. */
export function uploaderOf(fetcher: UploadFetcher): ProUploader {
  return async ({ url, headers, file }) => {
    try {
      const { size } = await stat(file);
      const response = await fetcher(url, {
        method: 'PUT',
        headers: { ...headers, 'content-length': String(size) },
        body: Readable.toWeb(createReadStream(file)) as ReadableStream<Uint8Array>,
        duplex: 'half',
      });

      return response.ok;
    } catch {
      return false;
    }
  };
}
