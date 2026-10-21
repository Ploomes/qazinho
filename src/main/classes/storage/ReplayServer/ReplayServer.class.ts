import type { IRunRef } from '@/shared/types';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join } from 'node:path';
import { ARCHIVE } from '@/main/classes/storage/Archive/constants';
import { REPLAY_SERVER } from './constants';
import { byteRangeOf, replayOfPath } from './library';

/** Serves the runs' recordings on loopback, in the byte ranges a <video> asks for, so a video seeks without crossing IPC. */
export class ReplayServer {
  private readonly token = randomUUID();
  private readonly dataRoot: string;
  private server: Server | null = null;
  private port = 0;

  public constructor(dataRoot: string) {
    this.dataRoot = dataRoot;
  }

  public async start(): Promise<void> {
    if (this.server) return;

    const server = createServer((request, response) => {
      void this.serve({ request, response });
    });

    await new Promise<void>((listening) => {
      server.listen(0, REPLAY_SERVER.host, listening);
    });

    this.server = server;
    this.port = (server.address() as AddressInfo).port;
  }

  /** The address of a run's recording, or null when the run has none on disk. */
  public async urlFor(ref: IRunRef): Promise<string | null> {
    if (!this.server || (await this.fileOf(ref)) === null) return null;

    return `http://${REPLAY_SERVER.host}:${String(this.port)}/${this.token}/${encodeURIComponent(ref.workspaceId)}/${encodeURIComponent(ref.runId)}`;
  }

  /** Where a run's recording lives on disk: an MP4 from the recorder window or a simulator, a WebM from an emulator. */
  public async fileOf(ref: IRunRef): Promise<string | null> {
    for (const name of Object.values(ARCHIVE.videos)) {
      const file = join(this.dataRoot, ARCHIVE.runs, ref.workspaceId, ref.runId, name);
      const found = await stat(file).catch(() => null);

      if (found?.isFile() === true) return file;
    }

    return null;
  }

  public close(): void {
    this.server?.close();
    this.server = null;
  }

  private async serve(props: {
    request: IncomingMessage;
    response: ServerResponse;
  }): Promise<void> {
    const { request, response } = props;
    const ref = replayOfPath({ path: request.url ?? '', token: this.token });
    const file = ref === null ? null : await this.fileOf(ref);
    const found = file === null ? null : await stat(file).catch(() => null);

    if (request.method !== 'GET' || file === null || found === null) {
      response.writeHead(404).end();

      return;
    }

    const range = byteRangeOf({ header: request.headers.range, size: found.size });
    const head = {
      'Content-Type': REPLAY_SERVER.types[extname(file)] ?? 'application/octet-stream',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-cache',
    };

    if (range.kind === 'outside') {
      response
        .writeHead(416, { ...head, 'Content-Range': `bytes */${String(found.size)}` })
        .end();

      return;
    }

    if (range.kind === 'whole') {
      response.writeHead(200, { ...head, 'Content-Length': String(found.size) });
      createReadStream(file).pipe(response);

      return;
    }

    response.writeHead(206, {
      ...head,
      'Content-Length': String(range.end - range.start + 1),
      'Content-Range': `bytes ${String(range.start)}-${String(range.end)}/${String(found.size)}`,
    });
    createReadStream(file, { start: range.start, end: range.end }).pipe(response);
  }
}
