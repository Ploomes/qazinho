import type { IAttachApp } from '@/harness/tools/servers/app/types';
import type { IAttachDevice } from '@/harness/tools/servers/device/types';
import type { IncomingMessage, Server as HttpServer, ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { MCP_HOST } from '@/harness/tools/constants';
import { callAppTool, registerAppTools } from '@/harness/tools/servers/app';
import { callDeviceTool, registerDeviceTools } from '@/harness/tools/servers/device';
import { workspaceOfPath } from './library';

/** Serves QAzinho's MCP tools on loopback: a workspace's device for the length of a run, and the app while the assistant answers. */
export class McpHost {
  private readonly token = randomUUID();
  private readonly devices = new Map<string, IAttachDevice>();
  private readonly apps = new Map<string, IAttachApp>();
  private readonly queues = new Map<string, Promise<unknown>>();
  private server: HttpServer | null = null;
  private port = 0;

  public async start(): Promise<void> {
    if (this.server) return;

    const server = createServer((request, response) => {
      void this.serve({ request, response });
    });

    await new Promise<void>((listening) => {
      server.listen(0, MCP_HOST.host, listening);
    });

    this.server = server;
    this.port = (server.address() as AddressInfo).port;
  }

  public attach(device: IAttachDevice): void {
    this.devices.set(device.workspaceId, device);
  }

  public detach(workspaceId: string): void {
    this.devices.delete(workspaceId);
    this.queues.delete(workspaceId);
  }

  /** Serves the app tools under the app's scope, each call carried out by it, until `detachApp`. */
  public attachApp(app: IAttachApp): void {
    this.apps.set(app.scope, app);
  }

  public detachApp(scope: string): void {
    this.apps.delete(scope);
    this.queues.delete(scope);
  }

  /** The `--mcp-config` an agent needs to reach the tools attached under a scope, and how long one call may take; null before start. */
  public mcpConfigFor(scope: string, toolTimeoutMs?: number): string | null {
    if (!this.server) return null;

    const url = `http://${MCP_HOST.host}:${String(this.port)}/${this.token}/${encodeURIComponent(scope)}`;

    return JSON.stringify({
      mcpServers: {
        [MCP_HOST.name]: {
          type: 'http',
          url,
          ...(toolTimeoutMs === undefined ? {} : { timeout: toolTimeoutMs }),
        },
      },
    });
  }

  public close(): void {
    this.devices.clear();
    this.apps.clear();
    this.queues.clear();
    this.server?.close();
    this.server = null;
  }

  private async serve(props: {
    request: IncomingMessage;
    response: ServerResponse;
  }): Promise<void> {
    const { request, response } = props;
    const scope = workspaceOfPath({ path: request.url ?? '', token: this.token });
    const device = scope === null ? undefined : this.devices.get(scope);
    const app = scope === null ? undefined : this.apps.get(scope);

    if (scope === null || (!device && !app)) {
      response.writeHead(404).end();

      return;
    }

    const mcp = new McpServer({ name: MCP_HOST.name, version: MCP_HOST.version });

    if (device)
      registerDeviceTools({
        mcp,
        purpose: device.purpose ?? 'walk',
        call: (call) =>
          this.inTurn({ scope, call: () => callDeviceTool({ device, call }) }),
      });
    else if (app)
      registerAppTools({
        mcp,
        call: (call) => this.inTurn({ scope, call: () => callAppTool({ app, call }) }),
      });

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    response.on('close', () => {
      void transport.close();
      void mcp.close();
    });

    await mcp.connect(transport);
    await transport.handleRequest(request, response);
  }

  private inTurn<T>(props: { scope: string; call: () => Promise<T> }): Promise<T> {
    const before = this.queues.get(props.scope) ?? Promise.resolve();
    const turn = before.then(props.call, props.call);

    this.queues.set(
      props.scope,
      turn.catch(() => undefined),
    );

    return turn;
  }
}
