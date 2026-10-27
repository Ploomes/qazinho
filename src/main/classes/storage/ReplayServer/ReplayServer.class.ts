import type { IRunRef } from '@/shared/types';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, sep } from 'node:path';
import { ARCHIVE } from '@/main/classes/storage/Archive/constants';
import { isInside } from '@/main/classes/storage/Archive/library';
import { REPLAY_SERVER } from './constants';
import { byteRangeOf, replayOfPath, suiteFileOfPath } from './library';

/**
 * Serves the runs' recordings, and what each test of a suite left behind, on loopback, in
 * the byte ranges a <video> asks for, so nothing heavy crosses IPC.
 */
export class ReplayServer {
  private readonly token = randomUUID();
  private readonly dataRoot: string;
  private readonly suitesRoot: string;
  private server: Server | null = null;
  private port = 0;

  public constructor(props: { dataRoot: string; suitesRoot: string }) {
    this.dataRoot = props.dataRoot;
    this.suitesRoot = props.suitesRoot;
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

  /**
   * The address of a file a suite's run left, from its run's folder; null before the
   * server listens.
   */
  public suiteFileUrl(props: {
    projectId: string;
    runId: string;
    file: string;
  }): string | null {
    if (!this.server) return null;

    const parts = [
      this.token,
      REPLAY_SERVER.suiteRoute,
      props.projectId,
      props.runId,
      ...props.file.split(sep),
    ];

    return `http://${REPLAY_SERVER.host}:${String(this.port)}/${parts.map(encodeURIComponent).join('/')}`;
  }

  /**
   * The file on disk an address this server handed out for a suite leads to; null for any
   * other address.
   */
  public suiteFileOfUrl(url: string): string | null {
    const parsed = URL.canParse(url) ? new URL(url) : null;

    if (
      !this.server ||
      parsed === null ||
      parsed.protocol !== 'http:' ||
      parsed.hostname !== REPLAY_SERVER.host ||
      parsed.port !== String(this.port)
    )
      return null;

    return this.suiteFileOf(parsed.pathname);
  }

  /**
   * Where a run's recording lives on disk: an MP4 from the recorder window or a
   * simulator, a WebM from an emulator; never outside the runs.
   */
  public async fileOf(ref: IRunRef): Promise<string | null> {
    for (const name of Object.values(ARCHIVE.videos)) {
      const file = join(this.dataRoot, ARCHIVE.runs, ref.workspaceId, ref.runId, name);

      if (!isInside({ root: join(this.dataRoot, ARCHIVE.runs), file })) return null;

      const found = await stat(file).catch(() => null);

      if (found?.isFile() === true) return file;
    }

    return null;
  }

  /**
   * The bytes of a run's MP4 recording, for the page to draw the network under; null for
   * a run with none, or one a phone recorded in another format.
   */
  public async videoOf(ref: IRunRef): Promise<Uint8Array | null> {
    const file = join(
      this.dataRoot,
      ARCHIVE.runs,
      ref.workspaceId,
      ref.runId,
      ARCHIVE.videos.mp4,
    );

    if (!isInside({ root: join(this.dataRoot, ARCHIVE.runs), file })) return null;

    return readFile(file).catch(() => null);
  }

  public close(): void {
    this.server?.close();
    this.server = null;
  }

  private suiteFileOf(path: string): string | null {
    const asked = suiteFileOfPath({ path, token: this.token });

    if (asked === null) return null;

    const file = join(
      this.suitesRoot,
      asked.projectId,
      REPLAY_SERVER.suiteRuns,
      asked.runId,
      ...asked.file,
    );

    return isInside({ root: this.suitesRoot, file }) ? file : null;
  }

  private async serve(props: {
    request: IncomingMessage;
    response: ServerResponse;
  }): Promise<void> {
    const { request, response } = props;
    const ref = replayOfPath({ path: request.url ?? '', token: this.token });
    const file =
      ref === null ? this.suiteFileOf(request.url ?? '') : await this.fileOf(ref);
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
