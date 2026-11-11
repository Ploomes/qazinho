import type { ElectronApplication, Page } from 'playwright-core';
import { chmod, mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { _electron as electron } from 'playwright-core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const PORT = 4371;
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
 * Um agente fake que anda três casos: explica o que prepara, para e confere o que o QA
 * disse no meio do caso, e usa duas telas com contas diferentes no segundo.
 */
const AGENT = `#!/usr/bin/env node
const { Client } = require(${JSON.stringify(join(SDK, 'index.js'))});
const { StreamableHTTPClientTransport } = require(${JSON.stringify(join(SDK, 'streamableHttp.js'))});
const argv = process.argv.slice(2);
if (argv[0] === '--version') { console.log('2.1.302 (Claude Code)'); process.exit(0); }
if (argv[0] === 'auth') { console.log(JSON.stringify({ loggedIn: true })); process.exit(0); }
if (argv[0] === 'mcp') process.exit(0);
const later = (ms) => new Promise((wake) => setTimeout(wake, ms));
const out = (line) => process.stdout.write(JSON.stringify(line) + '\\n');
const tool = (name, input) => out({ type: 'assistant', message: { content: [{ type: 'tool_use', name, input }] } });
process.on('SIGINT', () => process.exit(0));
let prompt = argv.join(' ');
process.stdin.on('data', (chunk) => { prompt += chunk; });
process.stdin.on('end', async () => {
  out({ type: 'system', subtype: 'init', session_id: 's-1' });
  const config = JSON.parse(argv[argv.indexOf('--mcp-config') + 1]);
  const client = new Client({ name: 'fake-agent', version: '1.0.0' });
  await client.connect(new StreamableHTTPClientTransport(new URL(config.mcpServers.qazinho.url)));
  let heard = false;
  let isGrey = false;
  const call = async (name, args) => {
    tool('mcp__qazinho__' + name, args);
    await later(180);
    const answer = await client.callTool({ name, arguments: args });
    for (const part of answer.content ?? []) {
      if (part.type !== 'text' || !part.text.includes('The QA just told you')) continue;
      heard = true;
      isGrey = part.text.includes('cinza');
    }
    return answer;
  };
  const check = async () => {
    if (!heard) return;
    heard = false;
    if (isGrey) {
      await call('answer_qa', { text: 'Conferi na tela e está tudo certo: sigo com o caso.' });
      return;
    }
    await call('bug', { title: 'O cabeçalho pisca ao salvar', severity: 'low', expected: 'Sem piscar', got: 'Piscou', category: 'style', target: 'Salvar' });
    await later(600);
    await call('answer_qa', { text: 'Olhei o cabeçalho e confirmei: ele pisca ao salvar. Abri um bug.' });
  };
  const report = async (step, proof) => {
    for (;;) {
      const answer = await call('report', { step, verdict: 'passed', why: 'Certo', got: proof, proof });
      const wasHeld = (answer.content ?? []).some((part) => part.type === 'text' && part.text.includes('again'));
      await check();
      if (!wasHeld) return;
    }
  };
  if (prompt.includes('already under way')) {
    await call('look', {});
    await check();
    for (const [, number] of prompt.matchAll(/^(\\d+)\\. /gm)) await report(Number(number), 'Painel de ninguém');
  } else if (prompt.includes('TC-01 ·')) {
    await call('say', { text: 'Este caso precisa de um pedido: a conta não tem, vou criar um antes' });
    for (let step = 1; step <= 14; step += 1) {
      await call('click', { target: 'Salvar' });
      if (step === 8) for (let wait = 0; wait < 90 && !heard; wait += 1) { await later(250); await call('look', {}); }
      await check();
      await report(step, 'Painel de ninguém');
    }
  } else if (prompt.includes('TC-02 ·')) {
    await call('goto', { target: ${JSON.stringify(BASE)} + '/entrar?como=Ana' });
    await report(1, 'Painel de Ana');
    await call('tab', { target: 'new_session', value: ${JSON.stringify(BASE)} + '/entrar?como=Bia' });
    await report(2, 'Painel de Bia');
    await later(900);
    await call('tab', { target: 'switch', value: '1' });
    await later(9000);
    await report(3, 'Painel de Ana');
  } else {
    await call('look', {});
    await call('bug', { title: 'Botão diz Salvar, e não Enviar', severity: 'medium', expected: 'Enviar', got: 'Salvar', category: 'text', target: 'Salvar' });
    await report(1, 'Painel de ninguém');
  }
  await client.close();
  out({ type: 'result', session_id: 's-1', is_error: false, result: 'done' });
});
`;

const site = createServer((request, response) => {
  const url = new URL(request.url ?? '/', BASE);

  if (url.pathname === '/entrar') {
    response.writeHead(302, {
      'set-cookie': `conta=${url.searchParams.get('como') ?? ''}; Path=/`,
      location: '/',
    });
    response.end();

    return;
  }

  const who = /conta=(\w+)/.exec(request.headers.cookie ?? '')?.[1] ?? 'ninguém';

  response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  response.end(
    `<!doctype html><html lang="pt"><body style="background:${who === 'Bia' ? '#274060' : who === 'Ana' ? '#3a5a40' : '#ffffff'};color:${who === 'ninguém' ? '#000' : '#fff'}"><h1>Painel de ${who}</h1><button>Salvar</button></body></html>`,
  );
});

const stepsOf = (count: number, title: string) =>
  Array.from(
    { length: count },
    (_, index) => `      - action: "${title} ${String(index + 1)}"
        expected: "Certo"`,
  ).join('\n');

let app: ElectronApplication;
let page: Page;

const shoot = async (name: string) => {
  if (SHOTS !== undefined) await page.screenshot({ path: join(SHOTS, `${name}.png`) });
};

beforeAll(async () => {
  await new Promise<void>((ready) => {
    site.listen(PORT, '127.0.0.1', ready);
  });

  const dataDir = await mkdtemp(join(tmpdir(), 'qazinho-together-'));
  const bin = await mkdtemp(join(tmpdir(), 'qazinho-together-bin-'));
  const folder = join(dataDir, 'workspaces', 'w-1');

  await writeFile(join(bin, 'claude'), AGENT);
  await chmod(join(bin, 'claude'), 0o755);
  await mkdir(folder, { recursive: true });
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
  await writeFile(
    join(folder, 'plan.yaml'),
    `cases:
  - id: TC-01
    title: "Salvar o painel muitas vezes"
    priority: P1
    goal: ""
    preconditions: ""
    lastVerdict: null
    steps:
${stepsOf(14, 'Salvar o painel, vez')}
  - id: TC-02
    title: "Duas pessoas no mesmo painel"
    priority: P1
    goal: ""
    preconditions: ""
    lastVerdict: null
    steps:
${stepsOf(3, 'Entrar com outra conta, parte')}
  - id: TC-03
    title: "Ler o botão do painel"
    priority: P2
    goal: ""
    preconditions: ""
    lastVerdict: null
    steps:
${stepsOf(1, 'Ler o botão')}
`,
  );
  await writeFile(
    join(folder, 'workspace.json'),
    JSON.stringify({
      id: 'w-1',
      projectId: 'p-1',
      name: 'Painel',
      targetId: 't-web',
      planKind: 'web',
      status: 'idle',
      viewportId: 'desktop',
      chat: [],
      runs: [],
      bugs: [],
    }),
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
  await page.getByText('Painel', { exact: true }).first().click();
}, 60_000);

afterAll(async () => {
  await app.close();
  site.close();
});

const listIsAtEnd = (selector: string, mustOverflow = true) =>
  page.evaluate(
    ({ chosen, overflow }) => {
      const web = globalThis as unknown as {
        document: {
          querySelector: (selector: string) => {
            scrollTop: number;
            scrollHeight: number;
            clientHeight: number;
          } | null;
        };
      };
      const list = web.document.querySelector(chosen);

      return list === null
        ? null
        : (!overflow || list.scrollHeight > list.clientHeight) &&
            list.scrollHeight - list.scrollTop - list.clientHeight < 60;
    },
    { chosen: selector, overflow: mustOverflow },
  );

const pictureIsDrawn = (selector: string) =>
  page.evaluate((chosen) => {
    const web = globalThis as unknown as {
      document: { querySelector: (selector: string) => { naturalWidth: number } | null };
    };

    return (web.document.querySelector(chosen)?.naturalWidth ?? 0) > 0;
  }, selector);

describe('a run the QA follows and talks to', () => {
  it('asks for the plan to be developed before anything is recorded', async () => {
    await page.getByRole('tab', { name: /Plano/ }).click();
    await page.locator('.plan-case__reason').first().waitFor({ timeout: 15_000 });
    await shoot('01-plan-to-develop');

    expect(await page.locator('.plan-case__reason').allTextContents()).toEqual([
      'por desenvolver',
      'por desenvolver',
      'por desenvolver',
    ]);
    await page.getByRole('button', { name: 'Desenvolver plano' }).waitFor();
  }, 60_000);

  it('says it is developing, and why it does what the step does not name', async () => {
    await page.getByRole('button', { name: 'Desenvolver plano' }).click();
    await page
      .locator('.status-pill', { hasText: 'desenvolvendo · passo' })
      .first()
      .waitFor({ timeout: 30_000 });
    await page
      .locator('.run-activity__line--say', { hasText: 'vou criar um antes' })
      .waitFor({ timeout: 30_000 });
    await shoot('02-developing-say');
  }, 60_000);

  it('keeps the steps list at its end as the run walks', async () => {
    await expect
      .poll(() => listIsAtEnd('.device-view__list'), { timeout: 30_000 })
      .toBe(true);
    await shoot('03-list-follows');
  }, 60_000);

  it('opens the focused device at the end of its list, grouped by case', async () => {
    await page.getByRole('button', { name: 'Ampliar' }).click();
    await page.locator('.device-focus__case').first().waitFor({ timeout: 10_000 });

    expect(await page.locator('.device-focus__case').first().textContent()).toBe(
      'Salvar o painel muitas vezes',
    );
    await expect
      .poll(() => listIsAtEnd('.device-focus__steps', false), { timeout: 15_000 })
      .toBe(true);
    await shoot('04-focus');
    await page.keyboard.press('Escape');
  }, 60_000);

  it('shows the case the run is on in the plan', async () => {
    await page.getByRole('tab', { name: /Plano/ }).click();
    await page.locator('.plan-case--now').waitFor({ timeout: 10_000 });

    expect(await page.locator('.plan-case--now').textContent()).toContain('TC-01');
    await shoot('05-plan-live');
    await page.getByRole('tab', { name: /Ao vivo/ }).click();
  }, 60_000);

  it('hears the QA in the middle of a case, checks, and answers in the chat', async () => {
    const composer = page.getByPlaceholder(/Diga aqui que o agente confere/).first();

    await composer.fill('Acho que o cabeçalho piscou quando salvou');
    await composer.press('Enter');
    await page.locator('.chat__talk').waitFor({ timeout: 10_000 });
    await shoot('06-talk-sent');
    await page
      .locator('.chat-row', { hasText: 'Olhei o cabeçalho e confirmei' })
      .waitFor({ timeout: 40_000 });
    await shoot('07-talk-answered');
  }, 90_000);

  it('shows two screens, each with its own account, and lets the QA look at either', async () => {
    const screens = page.locator('.screen-rail__screen');

    await screens.nth(1).waitFor({ timeout: 90_000 });
    await expect.poll(() => screens.count(), { timeout: 5_000 }).toBe(2);
    await expect
      .poll(() => page.locator('.screen-rail__screen .screen-rail__agent').count(), {
        timeout: 15_000,
      })
      .toBe(1);
    await screens.first().locator('.screen-rail__agent').waitFor({ timeout: 15_000 });
    await page.waitForTimeout(1_200);
    await shoot('08-two-screens');

    expect(await page.locator('.device-view__url').first().textContent()).toContain(
      '127.0.0.1',
    );
    await expect
      .poll(() => pictureIsDrawn('.device-screen__stream'), { timeout: 5_000 })
      .toBe(true);

    await screens.nth(1).click();
    await page.locator('.device-view__follow').waitFor({ timeout: 5_000 });
    await page.waitForTimeout(600);
    await shoot('09-qa-looks-at-other');
    await expect
      .poll(() => pictureIsDrawn('.device-screen__stream'), { timeout: 5_000 })
      .toBe(true);
    await page.locator('.device-view__follow').click();
    await page.locator('.device-view__follow').waitFor({ state: 'detached' });
  }, 120_000);

  it('lets the last bug leave, and only then says how the run ended', async () => {
    const flash = page.locator('.bug-flash');

    await flash.waitFor({ timeout: 90_000 });
    await shoot('10-last-flash');
    await page.evaluate(() => {
      const web = globalThis as unknown as {
        document: {
          querySelector: (selector: string) => { style: unknown } | null;
        };
        getComputedStyle: (element: unknown) => { opacity: string };
        requestAnimationFrame: (run: () => void) => void;
        samples: [number | null, boolean][];
      };

      web.samples = [];

      const sample = () => {
        const veil = web.document.querySelector('.bug-flash__veil');

        web.samples.push([
          veil === null ? null : Number(web.getComputedStyle(veil).opacity),
          web.document.querySelector('.device-off') !== null,
        ]);

        if (web.samples.length < 2_000) web.requestAnimationFrame(sample);
      };

      sample();
    });
    await page
      .getByRole('button', { name: 'Assistir à última run' })
      .or(page.getByRole('button', { name: 'Ver em Runs' }))
      .first()
      .waitFor({ timeout: 40_000 });
    await shoot('11-ended');

    const samples = await page.evaluate(
      () => (globalThis as unknown as { samples: [number | null, boolean][] }).samples,
    );
    const lastSeen = samples.findLastIndex(([veil]) => veil !== null);

    expect(
      samples.slice(0, lastSeen + 1).some(([veil]) => veil !== null && veil < 1),
    ).toBe(true);
    expect(samples.slice(0, lastSeen + 1).every(([, isOff]) => !isOff)).toBe(true);

    expect(await page.locator('.device-off__title').textContent()).toBe(
      'Run r-01 terminou.',
    );
    expect(await page.locator('.device-off__detail').textContent()).toBe('3 passaram');
  }, 150_000);

  it('runs from the recordings once every case is developed', async () => {
    await page.getByRole('tab', { name: /Plano/ }).click();
    await page.getByRole('button', { name: 'Rodar plano' }).waitFor({ timeout: 20_000 });
    await shoot('12-developed');

    expect(await page.locator('.plan-case__reason').count()).toBe(0);

    await page.getByRole('button', { name: 'Rodar plano' }).click();
    await page
      .locator('.status-pill', { hasText: 'rodando · passo' })
      .first()
      .waitFor({ timeout: 30_000 });
    await shoot('13-replaying');
    await page.getByRole('button', { name: 'Ver em Runs' }).waitFor({ timeout: 90_000 });
    await shoot('14-replay-ended');

    expect(await page.locator('.device-off__title').textContent()).toBe(
      'Run r-02 terminou.',
    );
  }, 180_000);

  it('hands a recording to the agent when the QA says something during it', async () => {
    await page.getByRole('button', { name: 'Rodar plano' }).click();
    await page
      .locator('.device-view__step', { hasText: 'vez 3' })
      .waitFor({ timeout: 30_000 });

    const composer = page.getByPlaceholder(/Diga aqui que o agente confere/).first();

    await composer.fill('Esse botão não deveria estar cinza');
    await composer.press('Enter');
    await page
      .locator('.chat-row', { hasText: 'Conferi na tela e está tudo certo' })
      .waitFor({ timeout: 60_000 });
    await shoot('15-replay-talk');
    await page.getByRole('button', { name: 'Ver em Runs' }).waitFor({ timeout: 120_000 });

    expect(await page.locator('.device-off__title').textContent()).toBe(
      'Run r-03 terminou.',
    );
    expect(await page.locator('.device-off__detail').textContent()).toBe('3 passaram');
  }, 240_000);
});
