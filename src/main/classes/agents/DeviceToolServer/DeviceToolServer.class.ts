import type { IAttachDevice } from './types';
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
import { actionOfToolCall, reportOfToolCall } from './library';

/** Hands each workspace's device to its agent as MCP tools on loopback, for the length of a run. */
export class DeviceToolServer {
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
      server.listen(0, DEVICE_TOOL_SERVER.host, listening);
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

    const url = `http://${DEVICE_TOOL_SERVER.host}:${String(this.port)}/${this.token}/${encodeURIComponent(workspaceId)}`;

    return JSON.stringify({
      mcpServers: { [DEVICE_TOOL_SERVER.name]: { type: 'http', url } },
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
      { name: DEVICE_TOOL_SERVER.name, version: DEVICE_TOOL_SERVER.version },
      { capabilities: { tools: {} } },
    );

    mcp.setRequestHandler(ListToolsRequestSchema, () => ({ tools: DEVICE_TOOLS }));
    mcp.setRequestHandler(CallToolRequestSchema, (call) =>
      // One call at a time per device: a report sent with the next action is filed before that action runs.
      this.inTurn({
        workspaceId,
        call: () =>
          this.call({ device, name: call.params.name, args: call.params.arguments }),
      }),
    );

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

  private inTurn<T>(props: { workspaceId: string; call: () => Promise<T> }): Promise<T> {
    const before = this.queues.get(props.workspaceId) ?? Promise.resolve();
    const turn = before.then(props.call, props.call);

    this.queues.set(
      props.workspaceId,
      turn.catch(() => undefined),
    );

    return turn;
  }

  private async call(props: {
    device: IAttachDevice;
    name: string;
    args: Record<string, unknown> | undefined;
  }): Promise<{ content: { type: 'text'; text: string }[]; isError: boolean }> {
    const { device, name, args } = props;
    const said = (text: string, isError = false) => ({
      content: [{ type: 'text' as const, text }],
      isError,
    });

    try {
      if (name === 'look') return said(await device.driver.describe());

      if (name === 'report') {
        const read = reportOfToolCall(args);

        if ('error' in read) return said(read.error, true);

        if (!device.onReport) return said('There is no run to report to.', true);

        return said(await device.onReport(read.report));
      }

      const read = actionOfToolCall({ name, args });

      if ('error' in read) return said(read.error, true);

      await device.driver.act(read.action);

      // The agent sees what its action did in the same answer, so it can correct course at once.
      return said(`Done. The device now shows:\n${await device.driver.describe()}`);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : String(reason);

      return said(`That did not work: ${stripAnsi(message)}`, true);
    }
  }
}
