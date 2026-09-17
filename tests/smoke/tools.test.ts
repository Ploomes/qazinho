import { mkdtemp } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DeviceToolServer } from '@/main/classes/agents/DeviceToolServer';
import { WebDriver } from '@/main/classes/devices/WebDriver';

const PORT = 4326;

const PAGE = `<!doctype html><html><body>
  <button onclick="document.getElementById('out').textContent='Signed in'">Sign in</button>
  <p id="out">Signed out</p>
</body></html>`;

const site = createServer((_request, response) => {
  response.writeHead(200, { 'content-type': 'text/html' });
  response.end(PAGE);
});
const tools = new DeviceToolServer();
let driver: WebDriver;

function textOf(result: Awaited<ReturnType<Client['callTool']>>): string {
  const [first] = result.content as { type: string; text?: string }[];

  return first?.text ?? '';
}

async function connect(workspaceId: string): Promise<Client> {
  const config = JSON.parse(tools.mcpConfigFor(workspaceId) ?? '{}') as {
    mcpServers: { gocrash: { url: string } };
  };
  const client = new Client({ name: 'smoke', version: '1.0.0' });

  await client.connect(
    new StreamableHTTPClientTransport(new URL(config.mcpServers.gocrash.url)),
  );

  return client;
}

beforeAll(async () => {
  await new Promise<void>((ready) => site.listen(PORT, '127.0.0.1', ready));
  await tools.start();

  driver = new WebDriver({
    url: `http://127.0.0.1:${String(PORT)}/`,
    profileDir: await mkdtemp(join(tmpdir(), 'gocrash-tools-')),
  });
  await driver.open();
  tools.attach({ workspaceId: 'w1', driver });
});

afterAll(async () => {
  await driver.close();
  tools.close();
  site.close();
});

describe('the device as MCP tools', () => {
  it('lists the actions an agent can take on the device', async () => {
    const client = await connect('w1');
    const listed = await client.listTools();

    expect(listed.tools.map(({ name }) => name)).toEqual([
      'look',
      'goto',
      'click',
      'fill',
      'press',
      'wait',
    ]);
    await client.close();
  });

  it('acts on the real browser and shows the agent what changed', async () => {
    const client = await connect('w1');
    const clicked = await client.callTool({
      name: 'click',
      arguments: { target: 'Sign in' },
    });

    expect(clicked.isError).toBe(false);
    expect(textOf(clicked)).toContain('Signed in');
    await client.close();
  });

  it('hands a failed action back as words the agent can act on, not a crash', async () => {
    const client = await connect('w1');
    const missed = await client.callTool({
      name: 'click',
      arguments: { target: 'Log in' },
    });

    expect(missed.isError).toBe(true);
    expect(textOf(missed)).toContain('That did not work');
    await client.close();
  });

  it('does NOT reach a workspace that has no device attached', async () => {
    await expect(connect('w-none')).rejects.toThrow();
  });
});
