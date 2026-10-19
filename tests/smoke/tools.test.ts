import { mkdtemp } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { McpHost } from '@/harness';
import { WebDriver } from '@/main/classes/devices/WebDriver';

const PORT = 4326;

/**
 * "Load more" answers late on purpose: its text lands 300 ms after the click, and a banner pushes
 * the page down as it does. Reading the page as soon as the network was idle used to miss both.
 */
const PAGE = `<!doctype html><html><body style="margin:0;font:16px sans-serif">
  <div id="slot"></div>
  <button onclick="document.getElementById('out').textContent='Signed in'">Sign in</button>
  <button onclick="setTimeout(() => {
    document.getElementById('slot').innerHTML = '<div style=height:240px;background:#fc0>Sale</div>';
    document.getElementById('more').textContent = 'Loaded 20 more';
  }, 300)">Load more</button>
  <p id="out">Signed out</p>
  <p id="more">Nothing more yet</p>
  <div style="height:900px"></div>
</body></html>`;

const site = createServer((_request, response) => {
  response.writeHead(200, { 'content-type': 'text/html' });
  response.end(PAGE);
});
const tools = new McpHost();
let driver: WebDriver;

/** Reads a JPEG's size from its start-of-frame marker, so a test can check a picture without decoding it. */
function jpegSize(jpeg: Buffer): { width: number; height: number } | null {
  let at = 2;

  while (at + 9 < jpeg.length) {
    const marker = jpeg[at + 1] ?? 0;
    const length = jpeg.readUInt16BE(at + 2);

    if (marker >= 0xc0 && marker <= 0xc2)
      return { height: jpeg.readUInt16BE(at + 5), width: jpeg.readUInt16BE(at + 7) };

    at += 2 + length;
  }

  return null;
}

function textOf(result: Awaited<ReturnType<Client['callTool']>>): string {
  const [first] = result.content as { type: string; text?: string }[];

  return first?.text ?? '';
}

async function connect(workspaceId: string): Promise<Client> {
  const config = JSON.parse(tools.mcpConfigFor(workspaceId) ?? '{}') as {
    mcpServers: { qazinho: { url: string } };
  };
  const client = new Client({ name: 'smoke', version: '1.0.0' });

  await client.connect(
    new StreamableHTTPClientTransport(new URL(config.mcpServers.qazinho.url)),
  );

  return client;
}

beforeAll(async () => {
  await new Promise<void>((ready) => site.listen(PORT, '127.0.0.1', ready));
  await tools.start();

  driver = new WebDriver({
    url: `http://127.0.0.1:${String(PORT)}/`,
    profileDir: await mkdtemp(join(tmpdir(), 'qazinho-tools-')),
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
  it('lists the actions an agent can take on the device, and the tools it reports and files bugs with', async () => {
    const client = await connect('w1');
    const listed = await client.listTools();

    expect(listed.tools.map(({ name }) => name)).toEqual([
      'look',
      'goto',
      'click',
      'fill',
      'press',
      'wait',
      'report',
      'bug',
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

  it('shows the agent a picture of the screen next to its text', async () => {
    const client = await connect('w1');
    const looked = await client.callTool({ name: 'look', arguments: {} });
    const picture = (
      looked.content as { type: string; mimeType?: string; data?: string }[]
    ).find(({ type }) => type === 'image');

    expect(picture?.mimeType).toBe('image/jpeg');
    expect(Buffer.from(picture?.data ?? '', 'base64').subarray(0, 2)).toEqual(
      Buffer.from([0xff, 0xd8]),
    );
    await client.close();
  });

  it('resizes the browser mid-session, and the picture the agent gets follows it', async () => {
    const client = await connect('w1');
    const sizeOf = async () => {
      const looked = await client.callTool({ name: 'look', arguments: {} });
      const picture = (looked.content as { type: string; data?: string }[]).find(
        ({ type }) => type === 'image',
      );

      return jpegSize(Buffer.from(picture?.data ?? '', 'base64'));
    };

    expect(await sizeOf()).toEqual({ width: 960, height: 600 });

    await driver.resize({ width: 390, height: 844 });

    expect(await sizeOf()).toEqual({ width: 293, height: 633 });

    await driver.resize({ width: 1280, height: 800 });
    await client.close();
  });

  it('waits for a late answer, and says how far the page jumped meanwhile', async () => {
    const client = await connect('w1');
    const loaded = await client.callTool({
      name: 'click',
      arguments: { target: 'Load more' },
    });

    expect(textOf(loaded)).toContain('Loaded 20 more');
    expect(textOf(loaded)).toMatch(/the layout shifted \d\.\d\d in \d+ moves?/);
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
