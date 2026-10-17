import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { LIVE_STREAM } from './constants';
import { mjpegPart, workspaceOfPath } from './library';

/** Serves each workspace's device as MJPEG on loopback, so video never crosses IPC. */
export class LiveStream {
  private readonly token = randomUUID();
  private readonly viewers = new Map<string, Set<ServerResponse>>();
  private readonly latest = new Map<string, Buffer>();
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

  public urlFor(workspaceId: string): string | null {
    if (!this.server) return null;

    return `http://${LIVE_STREAM.host}:${String(this.port)}/${this.token}/${encodeURIComponent(workspaceId)}`;
  }

  public push(props: { workspaceId: string; jpeg: Buffer }): void {
    this.latest.set(props.workspaceId, props.jpeg);

    const part = mjpegPart({ boundary: LIVE_STREAM.boundary, jpeg: props.jpeg });

    for (const viewer of this.viewers.get(props.workspaceId) ?? []) viewer.write(part);
  }

  public end(workspaceId: string): void {
    for (const viewer of this.viewers.get(workspaceId) ?? []) viewer.end();

    this.viewers.delete(workspaceId);
    this.latest.delete(workspaceId);
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

    response.writeHead(200, {
      'Content-Type': `multipart/x-mixed-replace; boundary=${LIVE_STREAM.boundary}`,
      'Cache-Control': 'no-store',
      Connection: 'close',
    });

    const viewers = this.viewers.get(workspaceId) ?? new Set<ServerResponse>();

    viewers.add(response);
    this.viewers.set(workspaceId, viewers);

    const latest = this.latest.get(workspaceId);

    if (latest)
      response.write(mjpegPart({ boundary: LIVE_STREAM.boundary, jpeg: latest }));

    request.on('close', () => {
      viewers.delete(response);
    });
  }
}
