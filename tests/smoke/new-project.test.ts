import type { ElectronApplication, Page } from 'playwright-core';
import { chmod, mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { _electron as electron } from 'playwright-core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const SDK = join(
  process.cwd(),
  'node_modules',
  '@modelcontextprotocol',
  'sdk',
  'dist',
  'cjs',
  'client',
);

/**
 * Um agente fake: no chat responde uma frase e um nome para o projeto, depois de um
 * instante, para o site nomear antes; numa exploração anota a vitrine da loja de exemplo,
 * busca vazio e termina sugerindo um caso.
 */
const AGENT = `#!/usr/bin/env node
const { Client } = require(${JSON.stringify(join(SDK, 'index.js'))});
const { StreamableHTTPClientTransport } = require(${JSON.stringify(join(SDK, 'streamableHttp.js'))});
const argv = process.argv.slice(2);
if (argv[0] === '--version') { console.log('2.1.302 (Claude Code)'); process.exit(0); }
if (argv[0] === 'auth') { console.log(JSON.stringify({ loggedIn: true })); process.exit(0); }
if (argv[0] === 'mcp') process.exit(0);
const say = (line) => process.stdout.write(JSON.stringify(line) + '\\n');
process.on('SIGINT', () => process.exit(0));
process.stdin.resume();
process.stdin.on('end', async () => {
  say({ type: 'system', subtype: 'init', session_id: 's-1' });
  if (argv.includes('--json-schema')) {
    await new Promise((done) => setTimeout(done, 1500));
    say({ type: 'assistant', message: { content: [{ type: 'tool_use', name: 'StructuredOutput', input: { reply: 'Li o design.', projectName: 'Cupons' } }] } });
    say({ type: 'result', session_id: 's-1', is_error: false, result: '' });
    return;
  }
  const config = JSON.parse(argv[argv.indexOf('--mcp-config') + 1]);
  const client = new Client({ name: 'fake-agent', version: '1.0.0' });
  await client.connect(new StreamableHTTPClientTransport(new URL(config.mcpServers.qazinho.url)));
  const call = async (name, args) => (await client.callTool({ name, arguments: args })).content?.[0]?.text ?? '';
  await call('screen', { name: 'Vitrine', about: 'A busca e os produtos.' });
  await call('click', { target: 'Buscar' });
  const finish = { summary: 'Uma tela.', cases: [{ title: 'Buscar produtos', priority: 'P1', goal: 'A busca acha os produtos.', preconditions: '', steps: [{ action: 'Buscar mochila', expected: 'Mochila urbana' }] }] };
  let told = await call('finish', finish);
  while (told.includes('still left')) told = await call('finish', finish);
  await client.close();
  say({ type: 'result', session_id: 's-1', is_error: false, result: 'done', total_cost_usd: 0.01 });
});
`;

const PORT = 4373;

const site = createServer((_request, response) => {
  response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  response.end(
    '<!doctype html><html lang="pt"><head><title>Checkout</title>' +
      '<meta property="og:site_name" content="Loja Online"></head>' +
      '<body><h1>Checkout</h1><button>Pagar</button></body></html>',
  );
});

let app: ElectronApplication;
let page: Page;

beforeAll(async () => {
  await new Promise<void>((ready) => {
    site.listen(PORT, '127.0.0.1', ready);
  });

  const dataDir = await mkdtemp(join(tmpdir(), 'qazinho-new-project-'));
  const bin = await mkdtemp(join(tmpdir(), 'qazinho-new-project-bin-'));

  await writeFile(join(bin, 'claude'), AGENT);
  await chmod(join(bin, 'claude'), 0o755);
  await mkdir(join(dataDir, 'workspaces'), { recursive: true });
  await writeFile(
    join(dataDir, 'projects.json'),
    JSON.stringify([
      {
        id: 'p-1',
        name: 'Blog',
        targets: [
          { id: 't-web', kind: 'web', label: 'Web', value: 'https://blog.test/' },
        ],
      },
    ]),
  );

  app = await electron.launch({
    args: [join(process.cwd(), 'out', 'main', 'index.js'), `--user-data-dir=${dataDir}`],
    env: { ...process.env, PATH: `${bin}:${process.env.PATH ?? ''}` },
  });
  page = await app.firstWindow();
  await page.waitForSelector('.titlebar');
  await page.evaluate(() => {
    const web = globalThis as unknown as {
      localStorage: { setItem: (key: string, value: string) => void };
    };

    web.localStorage.setItem(
      'qazinho.settings',
      JSON.stringify({
        state: { agent: 'Claude Code', language: 'pt', hasOnboarded: true },
        version: 1,
      }),
    );
  });
  await page.reload();
  await page.waitForSelector('.titlebar');
}, 60_000);

afterAll(async () => {
  await app.close();
  site.close();
});

describe('creating a project from cards', () => {
  it('asks only for what was picked, and names the new project after its site', async () => {
    await page.getByRole('button', { name: 'Novo projeto', exact: true }).first().click();
    await page.getByRole('button', { name: /Um endereço/ }).click();
    await page.getByRole('button', { name: /Um design/ }).click();

    expect(await page.getByText('2 marcados').count()).toBe(1);

    await page.getByRole('button', { name: /Continuar/ }).click();
    await page.getByLabel('O endereço do app').fill(`http://localhost:${String(PORT)}/`);
    await page
      .getByLabel('O design')
      .fill('https://www.figma.com/design/AbC123/Loja-Checkout?node-id=12-34');

    expect(await page.getByLabel('O build').count()).toBe(0);
    expect(await page.getByLabel('Nome do projeto').count()).toBe(0);

    await page.getByRole('button', { name: 'Criar projeto' }).click();

    await expect
      .poll(() => page.locator('.sidebar').getByText('Loja Checkout').count(), {
        timeout: 10_000,
      })
      .toBe(1);
    await expect
      .poll(() => page.locator('.sidebar__group-name').allTextContents(), {
        timeout: 10_000,
      })
      .toContain('Loja Online');
    expect(
      await page.getByText('Chamei o projeto de Loja Online, pelo site.').count(),
    ).toBe(1);
    await expect
      .poll(() => page.getByText('Li o design.').count(), { timeout: 20_000 })
      .toBeGreaterThan(0);
    expect(await page.locator('.sidebar__group-name').allTextContents()).not.toContain(
      'Cupons',
    );
  });

  it('starts from nothing on the example shop, and explores it', async () => {
    await page.getByRole('button', { name: 'Novo projeto', exact: true }).first().click();
    await page.getByRole('button', { name: /Não tenho nada ainda/ }).click();
    await page.getByRole('button', { name: /Continuar/ }).click();
    await page.getByRole('button', { name: 'Começar' }).click();

    await expect
      .poll(() => page.locator('.sidebar').getByText('Loja de exemplo').count(), {
        timeout: 10_000,
      })
      .toBe(1);
    await expect
      .poll(() => page.getByText(/Plano sugerido/).count(), { timeout: 60_000 })
      .toBeGreaterThan(0);
  }, 90_000);

  it('plans before the app, and takes the name the chat agent gives', async () => {
    await page.getByRole('button', { name: 'Novo projeto', exact: true }).first().click();
    await page.getByRole('button', { name: /Não tenho nada ainda/ }).click();
    await page.getByRole('button', { name: /Continuar/ }).click();
    await page.getByRole('button', { name: /Planejar antes do app/ }).click();
    await page.getByLabel('Planejar antes do app').fill('O cupom de primeira compra');
    await page.getByRole('button', { name: 'Começar' }).click();

    await expect
      .poll(() => page.locator('.sidebar__group-name--pending').count(), {
        timeout: 5_000,
      })
      .toBe(1);
    await expect
      .poll(() => page.locator('.sidebar__group-name').allTextContents(), {
        timeout: 20_000,
      })
      .toContain('Cupons');
    expect(await page.locator('.sidebar__group-name--pending').count()).toBe(0);
    expect(await page.getByText('Chamei o projeto de Cupons.').count()).toBe(1);
  }, 40_000);
});
