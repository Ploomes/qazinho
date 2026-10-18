import type { IAttachDevice } from '@/harness/tools/servers/device/types';
import type { IncomingMessage, Server as HttpServer, ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { MCP_HOST } from '@/harness/tools/constants';
import { callDeviceTool, listDeviceTools } from '@/harness/tools/servers/device';
import { workspaceOfPath } from './library';

/** Serves QAzinho's MCP tools on loopback, one address per workspace, for the length of a run. */
export class McpHost {
  private readonly token = randomUUID();
  private readonly devices = new Map<string, IAttachDevice>();
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

  /** The `--mcp-config` an agent needs to reach this workspace's device, or null before start. */
  public mcpConfigFor(workspaceId: string): string | null {
    if (!this.server) return null;

    const url = `http://${MCP_HOST.host}:${String(this.port)}/${this.token}/${encodeURIComponent(workspaceId)}`;

    return JSON.stringify({
      mcpServers: { [MCP_HOST.name]: { type: 'http', url } },
    });
  }

  public close(): void {
    this.devices.clear();
    this.queues.clear();
    this.server?.close();
    this.server = null;
  }

  private async serve(props: {
    request: IncomingMessage;
    response: ServerResponse;
  }): Promise<void> {
    const { request, response } = props;
    const workspaceId = workspaceOfPath({ path: request.url ?? '', token: this.token });
    const device = workspaceId === null ? undefined : this.devices.get(workspaceId);

    if (!device || workspaceId === null) {
      response.writeHead(404).end();

      return;
    }

    const mcp = new Server(
      { name: MCP_HOST.name, version: MCP_HOST.version },
      { capabilities: { tools: {} } },
    );

    mcp.setRequestHandler(ListToolsRequestSchema, () => ({ tools: listDeviceTools() }));
    mcp.setRequestHandler(CallToolRequestSchema, (call) =>
      this.inTurn({
        workspaceId,
        call: () =>
          callDeviceTool({
            device,
            call: { name: call.params.name, args: call.params.arguments },
          }),
      }),
    );

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

  private inTurn<T>(props: { workspaceId: string; call: () => Promise<T> }): Promise<T> {
    const before = this.queues.get(props.workspaceId) ?? Promise.resolve();
    const turn = before.then(props.call, props.call);

    this.queues.set(
      props.workspaceId,
      turn.catch(() => undefined),
    );

    return turn;
  }
}
