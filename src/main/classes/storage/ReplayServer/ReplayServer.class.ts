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
 * Serve em loopback as gravações das runs, e o que cada teste de uma suíte deixou, nos
 * intervalos de bytes que um <video> pede, para nada pesado cruzar o IPC.
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

  /** O endereço da gravação de uma run, ou null quando a run não tem nenhuma no disco. */
  public async urlFor(ref: IRunRef): Promise<string | null> {
    if (!this.server || (await this.fileOf(ref)) === null) return null;

    return `http://${REPLAY_SERVER.host}:${String(this.port)}/${this.token}/${encodeURIComponent(ref.workspaceId)}/${encodeURIComponent(ref.runId)}`;
  }

  /**
   * O endereço de um arquivo que a run de uma suíte deixou, a partir da pasta da run;
   * null antes de o servidor escutar.
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
   * O arquivo em disco a que leva um endereço que este servidor deu para uma suíte; null
   * para qualquer outro endereço.
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
   * Onde a gravação de uma run vive no disco: um MP4 da janela do gravador ou de um
   * simulador, um WebM de um emulador; nunca fora das runs.
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
   * Os bytes da gravação MP4 de uma run, para a página desenhar a rede embaixo; null para
   * uma run sem nenhuma, ou uma que um celular gravou em outro formato.
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
