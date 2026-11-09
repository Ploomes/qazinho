import type { ElectronApplication, Page } from 'playwright-core';
import { readFileSync } from 'node:fs';
import { chmod, mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { _electron as electron } from 'playwright-core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const PORT = 4372;
const BASE = `http://127.0.0.1:${String(PORT)}`;
const SHOTS = process.env.QZ_SHOTS;

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
 * Um agente fake. No chat, anda pelo app no navegador do chat e demora para responder. Na
 * run, pergunta ao QA, sobe os arquivos que o plano nomeia, tenta um que ninguém deu e sobe
 * o anexo do chat, guardando num arquivo cada tela que leu.
 */
const agentOf = (props: {
  log: string;
  folder: string;
  elsewhere: string;
}) => `#!/usr/bin/env node
const { appendFileSync } = require('node:fs');
const { Client } = require(${JSON.stringify(join(SDK, 'index.js'))});
const { StreamableHTTPClientTransport } = require(${JSON.stringify(join(SDK, 'streamableHttp.js'))});
const argv = process.argv.slice(2);
if (argv[0] === '--version') { console.log('2.1.302 (Claude Code)'); process.exit(0); }
if (argv[0] === 'auth') { console.log(JSON.stringify({ loggedIn: true })); process.exit(0); }
if (argv[0] === 'mcp') process.exit(0);
const LOG = ${JSON.stringify(props.log)};
const FOLDER = ${JSON.stringify(props.folder)};
const ELSEWHERE = ${JSON.stringify(props.elsewhere)};
const later = (ms) => new Promise((wake) => setTimeout(wake, ms));
const out = (line) => process.stdout.write(JSON.stringify(line) + '\\n');
const note = (kind, text) => appendFileSync(LOG, JSON.stringify({ kind, text }) + '\\n');
const textOf = (answer) => (answer.content ?? []).map((part) => part.text ?? '').join('');
process.on('SIGINT', () => process.exit(0));
let prompt = '';
process.stdin.on('data', (chunk) => { prompt += chunk; });
process.stdin.on('end', async () => {
  out({ type: 'system', subtype: 'init', session_id: 's-1' });
  const finish = (result) => out({ type: 'result', session_id: 's-1', is_error: false, result, structured_output: JSON.parse(result) });
  if (prompt.includes('What changes in what QAzinho keeps?')) return finish(JSON.stringify({ ops: [] }));
  const config = JSON.parse(argv[argv.indexOf('--mcp-config') + 1]);
  const client = new Client({ name: 'fake-agent', version: '1.0.0' });
  await client.connect(new StreamableHTTPClientTransport(new URL(config.mcpServers.qazinho.url)));
  const call = (name, args) => client.callTool({ name, arguments: args });
  if (!prompt.includes('Carry out these steps')) {
    await call('goto', { target: ${JSON.stringify(BASE)} });
    await later(9000);
    await client.close();
    return finish(JSON.stringify({ reply: 'Olhei o app.', plan: null, questions: null }));
  }
  note('prompt', prompt);
  const asked = await call('ask_qa', { question: 'Qual lote devo enviar?', options: ['Lote A', 'Lote B'] });
  note('answer', textOf(asked));
  note('own', textOf(await call('upload', { target: 'Anexar', paths: [FOLDER + '/capa.html', FOLDER + '/logo.png'] })));
  note('own-page', textOf(await call('look', {})));
  await call('report', { step: 1, verdict: 'passed', why: 'Certo', got: 'Enviados', proof: 'Enviados: capa.html, logo.png' });
  const refused = await call('upload', { target: 'Anexar', paths: ['/etc/hosts'] });
  note('refused', JSON.stringify({ isError: refused.isError === true, text: textOf(refused) }));
  note('refused-page', textOf(await call('look', {})));
  const attached = /- nota\\.pdf: (.+)/.exec(prompt);
  note('attached', textOf(await call('upload', { target: 'Anexar', paths: [attached ? attached[1].trim() : 'none'] })));
  note('attached-page', textOf(await call('look', {})));
  const outside = ELSEWHERE + '/dito.pdf';
  const early = await call('upload', { target: 'Anexar', paths: [outside] });
  note('early', JSON.stringify({ isError: early.isError === true }));
  note('told', textOf(await call('ask_qa', { question: 'Qual o caminho inteiro do outro arquivo?' })));
  note('told-upload', textOf(await call('upload', { target: 'Anexar', paths: [outside] })));
  note('told-page', textOf(await call('look', {})));
  await call('report', { step: 2, verdict: 'passed', why: 'Certo', got: 'Enviados', proof: 'Enviados: nota.pdf' });
  await client.close();
  out({ type: 'result', session_id: 's-1', is_error: false, result: 'done' });
});
`;

const PAGE = `<!doctype html><html lang="pt"><body style="font:20px sans-serif;padding:40px">
<h1>Modelos</h1>
<label>Anexar <input type="file" multiple onchange="document.getElementById('out').textContent = 'Enviados: ' + [...this.files].map((file) => file.name).join(', ')"></label>
<p id="out">Nada enviado</p></body></html>`;

const site = createServer((_request, response) => {
  response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  response.end(PAGE);
});

let app: ElectronApplication;
let page: Page;
let log: string;
let elsewhere: string;

const shoot = async (name: string) => {
  if (SHOTS !== undefined) await page.screenshot({ path: join(SHOTS, `${name}.png`) });
};

const noted = (kind: string) =>
  readFileSync(log, 'utf8')
    .split('\n')
    .filter((line) => line !== '')
    .map((line) => JSON.parse(line) as { kind: string; text: string })
    .find((entry) => entry.kind === kind)?.text;

beforeAll(async () => {
  await new Promise<void>((ready) => {
    site.listen(PORT, '127.0.0.1', ready);
  });

  const dataDir = await mkdtemp(join(tmpdir(), 'qazinho-attach-'));
  const bin = await mkdtemp(join(tmpdir(), 'qazinho-attach-bin-'));
  const fixtures = await mkdtemp(join(tmpdir(), 'qazinho-attach-lote-'));
  const planless = join(dataDir, 'workspaces', 'w-1');
  const planned = join(dataDir, 'workspaces', 'w-2');
  const attachments = join(dataDir, 'attachments', 'w-2');

  log = join(bin, 'heard.log');
  await writeFile(log, '');
  elsewhere = await mkdtemp(join(tmpdir(), 'qazinho-attach-fora-'));
  await writeFile(join(elsewhere, 'dito.pdf'), 'pdf');
  await writeFile(join(bin, 'claude'), agentOf({ log, folder: fixtures, elsewhere }));
  await chmod(join(bin, 'claude'), 0o755);
  await writeFile(join(fixtures, 'capa.html'), '<h1>Capa</h1>');
  await writeFile(join(fixtures, 'logo.png'), 'png');
  await mkdir(attachments, { recursive: true });
  await writeFile(join(attachments, 'ab12cd34-nota.pdf'), 'pdf');
  await mkdir(planless, { recursive: true });
  await mkdir(planned, { recursive: true });
  await writeFile(
    join(dataDir, 'projects.json'),
    JSON.stringify([
      {
        id: 'p-1',
        name: 'Loja',
        targets: [{ id: 't-web', kind: 'web', label: 'Web', value: `${BASE}/` }],
      },
    ]),
  );

  const workspace = (id: string, name: string) =>
    JSON.stringify({
      id,
      projectId: 'p-1',
      name,
      targetId: 't-web',
      planKind: 'web',
      status: 'idle',
      viewportId: 'desktop',
      chat: [],
      runs: [],
      bugs: [],
    });

  await writeFile(join(planless, 'workspace.json'), workspace('w-1', 'Sem plano'));
  await writeFile(join(planned, 'workspace.json'), workspace('w-2', 'Com plano'));
  await writeFile(
    join(planned, 'plan.yaml'),
    `cases:
  - id: TC-01
    title: "Enviar arquivos"
    priority: P1
    goal: ""
    preconditions: ""
    lastVerdict: null
    steps:
      - action: "Anexar os arquivos da pasta ${fixtures}/: capa.html e logo.png"
        expected: "Os dois aparecem"
      - action: "Anexar a nota que mandei no chat"
        expected: "A nota aparece"
`,
  );

  app = await electron.launch({
    args: [join(process.cwd(), 'out', 'main', 'index.js'), `--user-data-dir=${dataDir}`],
    env: { ...process.env, PATH: `${bin}:${process.env.PATH ?? ''}` },
  });
  page = await app.firstWindow();
  await page.waitForSelector('.titlebar');
  await app.evaluate(({ BrowserWindow }) => {
    BrowserWindow.getAllWindows()[0]?.setSize(1560, 980);
  });
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
  await page.getByText('Loja', { exact: true }).first().click();
}, 60_000);

afterAll(async () => {
  await app.close();
  site.close();
});

describe('what the QA gives and sees while the agent works', () => {
  it('shows the browser the chat walks in, even with no plan yet', async () => {
    await page.getByText('Sem plano', { exact: true }).first().click();
    await page.locator('.agent-panel--alone').waitFor({ timeout: 15_000 });

    const box = page.locator('.composer__input').first();

    await box.fill('Olha o app e me diz o que ele faz.');
    await box.press('Enter');
    await page.locator('.device-view__browser').waitFor({ timeout: 45_000 });

    expect(await page.locator('.agent-panel--alone').count()).toBe(0);
    await expect
      .poll(() => page.locator('.panel-tabs__tab--active').textContent())
      .toMatch(/Ao vivo|Dispositivo/);
    await page.waitForTimeout(1200);
    await shoot('01-chat-browser');
  }, 90_000);

  it('brings the question to the focused screen, answered right there', async () => {
    await page.getByText('Com plano', { exact: true }).first().click();
    await page.getByRole('button', { name: 'Desenvolver plano' }).click();
    await page.getByRole('button', { name: 'Ampliar' }).click({ timeout: 45_000 });
    await page
      .locator('.device-focus__ask .ask-card__question', {
        hasText: 'Qual lote devo enviar?',
      })
      .waitFor({ timeout: 45_000 });
    await page.waitForTimeout(600);
    await shoot('02-focus-question');

    expect(
      await page.evaluate(() => {
        const web = globalThis as unknown as {
          document: { activeElement: { closest: (at: string) => unknown } | null };
        };

        return web.document.activeElement?.closest('.device-focus__side') !== null;
      }),
    ).toBe(true);

    await page
      .locator('.device-focus__ask .ask-card__option', { hasText: 'Lote A' })
      .click();
    await page
      .locator('.device-focus__ask')
      .waitFor({ state: 'detached', timeout: 15_000 });
    expect(await page.locator('.device-focus').count()).toBe(1);
  }, 120_000);

  it('picks the files the plan names, in one go, on a real Chrome', async () => {
    await expect
      .poll(() => noted('own-page'), { timeout: 45_000 })
      .toContain('Enviados: capa.html, logo.png');
    expect(noted('answer')).toContain('Lote A');
    await shoot('03-focus-uploaded');
  }, 60_000);

  it('refuses a file nobody gave the run, and the page never gets it', async () => {
    await expect.poll(() => noted('refused-page'), { timeout: 30_000 }).toBeDefined();

    const refused = JSON.parse(noted('refused') ?? '{}') as {
      isError: boolean;
      text: string;
    };

    expect(refused.isError).toBe(true);
    expect(refused.text).toContain('/etc/hosts was not given to this run');
    expect(noted('refused-page')).toContain('Enviados: capa.html, logo.png');
    expect(noted('refused-page')).not.toContain('hosts');
  }, 45_000);

  it('picks an attachment of the chat under the name the QA gave it', async () => {
    expect(noted('prompt')).toContain('Files the QA attached');
    await expect
      .poll(() => noted('attached-page'), { timeout: 30_000 })
      .toContain('Enviados: nota.pdf');
    expect(noted('attached-page')).not.toContain('ab12cd34');
  }, 45_000);

  it('picks a file the QA named in words, and not before they named it', async () => {
    await page
      .locator('.device-focus__ask .ask-card__question', {
        hasText: 'Qual o caminho inteiro',
      })
      .waitFor({ timeout: 30_000 });

    expect(JSON.parse(noted('early') ?? '{}')).toEqual({ isError: true });

    await page.locator('.device-focus__ask input').first().fill(`${elsewhere}/dito.pdf`);
    await page
      .locator('.device-focus__ask button', { hasText: 'Responder' })
      .first()
      .click();
    await expect
      .poll(() => noted('told-page'), { timeout: 30_000 })
      .toContain('Enviados: dito.pdf');
  }, 60_000);
});
