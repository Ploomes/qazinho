import type { IDeviceDriver } from '@/main/classes/devices/types';
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
import { workspaceOfPath } from '@/main/classes/devices/LiveStream/library';
import { stripAnsi } from '@/main/library';
import { DEVICE_TOOL_SERVER, DEVICE_TOOLS } from './constants';
import { actionOfToolCall } from './library';

/** Hands each workspace's device to its agent as MCP tools on loopback, for the length of a run. */
export class DeviceToolServer {
  private readonly token = randomUUID();
  private readonly drivers = new Map<string, IDeviceDriver>();
  private server: HttpServer | null = null;
  private port = 0;

  public async start(): Promise<void> {
    if (this.server) return;

    const server = createServer((request, response) => {
      void this.serve({ request, response });
    });

    await new Promise<void>((listening) => {
      server.listen(0, DEVICE_TOOL_SERVER.host, listening);
    });

    this.server = server;
    this.port = (server.address() as AddressInfo).port;
  }

  public attach(props: { workspaceId: string; driver: IDeviceDriver }): void {
    this.drivers.set(props.workspaceId, props.driver);
  }

  public detach(workspaceId: string): void {
    this.drivers.delete(workspaceId);
  }

  /** The `--mcp-config` an agent needs to reach this workspace's device, or null before start. */
  public mcpConfigFor(workspaceId: string): string | null {
    if (!this.server) return null;

    const url = `http://${DEVICE_TOOL_SERVER.host}:${String(this.port)}/${this.token}/${encodeURIComponent(workspaceId)}`;

    return JSON.stringify({
      mcpServers: { [DEVICE_TOOL_SERVER.name]: { type: 'http', url } },
    });
  }

  public close(): void {
    this.drivers.clear();
    this.server?.close();
    this.server = null;
  }

  private async serve(props: {
    request: IncomingMessage;
    response: ServerResponse;
  }): Promise<void> {
    const { request, response } = props;
    const workspaceId = workspaceOfPath({ path: request.url ?? '', token: this.token });
    const driver = workspaceId === null ? undefined : this.drivers.get(workspaceId);

    if (!driver) {
      response.writeHead(404).end();

      return;
    }

    const mcp = new Server(
      { name: DEVICE_TOOL_SERVER.name, version: DEVICE_TOOL_SERVER.version },
      { capabilities: { tools: {} } },
    );

    mcp.setRequestHandler(ListToolsRequestSchema, () => ({ tools: DEVICE_TOOLS }));
    mcp.setRequestHandler(CallToolRequestSchema, async (call) => {
      const said = (text: string, isError = false) => ({
        content: [{ type: 'text' as const, text }],
        isError,
      });

      try {
        if (call.params.name === 'look') return said(await driver.describe());

        const read = actionOfToolCall({
          name: call.params.name,
          args: call.params.arguments,
        });

        if ('error' in read) return said(read.error, true);

        await driver.act(read.action);

        // The agent sees what its action did in the same answer, so it can correct course at once.
        return said(`Done. The device now shows:\n${await driver.describe()}`);
      } catch (reason) {
        const message = reason instanceof Error ? reason.message : String(reason);

        return said(`That did not work: ${stripAnsi(message)}`, true);
      }
    });

    // Stateless: every request gets its own server and transport, and nothing outlives it.
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
}
