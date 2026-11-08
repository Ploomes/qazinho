import type { ILiveFrame } from './types';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { LIVE_STREAM } from './constants';
import { isStillPath, mjpegPart, streamKeyOf, workspaceOfPath } from './library';

/**
 * Serve o dispositivo de cada workspace como MJPEG em loopback, para o vídeo nunca cruzar
 * o IPC: ao <img> da página, e à janela do gravador.
 */
export class LiveStream {
  private readonly token = randomUUID();
  private readonly viewers = new Map<string, Set<ServerResponse>>();
  private readonly latest = new Map<string, ILiveFrame>();
  private server: Server | null = null;
  private port = 0;

  public async start(): Promise<void> {
    if (this.server) return;

    const server = createServer((request, response) => {
      this.serve({ request, response });
    });

    await new Promise<void>((listening) => {
      server.listen(0, LIVE_STREAM.host, listening);
    });

    this.server = server;
    this.port = (server.address() as AddressInfo).port;
  }

  public urlFor(workspaceId: string, screen?: number): string | null {
    if (!this.server) return null;

    return `http://${LIVE_STREAM.host}:${String(this.port)}/${this.token}/${encodeURIComponent(streamKeyOf({ workspaceId, screen }))}`;
  }

  public push(props: {
    workspaceId: string;
    screen?: number;
    jpeg: Buffer;
    ratio: number;
  }): void {
    const key = streamKeyOf({ workspaceId: props.workspaceId, screen: props.screen });
    const frame = { jpeg: props.jpeg, at: Date.now(), ratio: props.ratio };

    this.latest.set(key, frame);

    const part = mjpegPart({ boundary: LIVE_STREAM.boundary, ...frame });

    for (const viewer of this.viewers.get(key) ?? []) viewer.write(part);
  }

  public end(workspaceId: string): void {
    const keys = [...new Set([...this.viewers.keys(), ...this.latest.keys()])].filter(
      (key) =>
        key === workspaceId || key.startsWith(`${workspaceId}${LIVE_STREAM.screenMark}`),
    );

    for (const key of keys) {
      for (const viewer of this.viewers.get(key) ?? []) viewer.end();

      this.viewers.delete(key);
      this.latest.delete(key);
    }
  }

  public close(): void {
    for (const workspaceId of [...this.viewers.keys()]) this.end(workspaceId);

    this.server?.close();
    this.server = null;
  }

  private serve(props: { request: IncomingMessage; response: ServerResponse }): void {
    const { request, response } = props;
    const workspaceId = workspaceOfPath({ path: request.url ?? '', token: this.token });

    if (request.method !== 'GET' || workspaceId === null) {
      response.writeHead(404).end();

      return;
    }

    if (isStillPath(request.url ?? '')) {
      const frame = this.latest.get(workspaceId);

      if (frame === undefined) response.writeHead(204).end();
      else
        response
          .writeHead(200, {
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'no-store',
            'Access-Control-Allow-Origin': '*',
            Connection: 'close',
          })
          .end(frame.jpeg);

      return;
    }

    response.writeHead(200, {
      'Content-Type': `multipart/x-mixed-replace; boundary=${LIVE_STREAM.boundary}`,
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
      Connection: 'close',
    });

    const viewers = this.viewers.get(workspaceId) ?? new Set<ServerResponse>();

    viewers.add(response);
    this.viewers.set(workspaceId, viewers);

    const latest = this.latest.get(workspaceId);

    if (latest) {
      const part = mjpegPart({ boundary: LIVE_STREAM.boundary, ...latest });

      response.write(part);
      response.write(part);
    }

    request.on('close', () => {
      viewers.delete(response);
    });
  }
}
