import { mkdtemp } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WebDriver } from '@salve-software/qazinho-harness/engine';

const OUTER = 4357;
const INNER = 4358;

/**
 * O painel de uma loja em localhost com um construtor de telas num iframe em 127.0.0.1,
 * outro site, que o Chrome roda num processo próprio. O construtor tem um iframe de fluxos
 * em localhost, de novo outro site. O agente via só uma caixa vazia no lugar do
 * construtor e abria um bug dizendo que a tela não mudou.
 */
const PAGES: Record<string, string> = {
  outer: `<h1>Painel</h1><nav><a href="#">Etiquetas</a></nav>
<iframe title="Builder" src="http://127.0.0.1:${String(INNER)}/" width="900" height="500"></iframe>`,
  '/': `<h1>Construtor</h1>
<button onclick="fetch('/api/labels').then(() => { document.getElementById('modal').textContent = 'Etiqueta nova aberta'; })">Nova etiqueta</button>
<p id="modal">Nada aberto</p>
<label>Nome <input oninput="document.getElementById('typed').textContent = 'Nome: ' + this.value"></label>
<p id="typed">Sem nome</p>
<iframe title="Fluxos" src="http://localhost:${String(INNER)}/flows" width="400" height="150"></iframe>`,
  '/flows': `<button onclick="document.getElementById('flow').textContent = 'Fluxo aberto'">Abrir fluxo</button>
<p id="flow">Nenhum fluxo</p>`,
};

const outer = createServer((_request, response) => {
  response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  response.end(`<!doctype html><html><body>${PAGES.outer ?? ''}</body></html>`);
});

const inner = createServer((request, response) => {
  if (request.url === '/api/labels') {
    response.writeHead(500, { 'content-type': 'application/json' });
    response.end('{"error":"labels are down"}');

    return;
  }

  response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  response.end(
    `<!doctype html><html><body>${PAGES[request.url ?? '/'] ?? ''}</body></html>`,
  );
});

let driver: WebDriver;

beforeAll(async () => {
  await new Promise<void>((ready) => outer.listen(OUTER, 'localhost', ready));
  await new Promise<void>((ready) => inner.listen(INNER, '0.0.0.0', ready));
  driver = new WebDriver({
    url: `http://localhost:${String(OUTER)}/`,
    profileDir: await mkdtemp(join(tmpdir(), 'qazinho-frames-')),
  });
  await driver.open();
  await driver.act({ kind: 'wait', target: '', value: '1500' });
});

afterAll(async () => {
  await driver.close();
  outer.close();
  inner.close();
});

describe('an app shown in an iframe of another site', () => {
  it('describes what each iframe shows, nested ones too', async () => {
    const screen = await driver.describe();

    expect(screen).toContain('FRAME "Builder"');
    expect(screen).toContain('button: Nova etiqueta');
    expect(screen).toContain('FRAME "Fluxos"');
    expect(screen).toContain('button: Abrir fluxo');
  });

  it('clicks inside it, through a locator the exported code can repeat', async () => {
    const since = Date.now();

    await driver.act({ kind: 'click', target: 'Nova etiqueta', value: '' });

    expect(await driver.describe()).toContain('Etiqueta nova aberta');
    expect(driver.resolution()?.locator).toContain('contentFrame()');
    expect(
      driver.apiCalls(since).map(({ url, status }) => `${String(status)} ${url}`),
    ).toEqual(expect.arrayContaining([expect.stringMatching(/^500 .*\/api\/labels$/)]));
  });

  it('types into a field inside it', async () => {
    await driver.act({ kind: 'fill', target: 'Nome', value: 'Promo' });

    expect(await driver.describe()).toContain('Nome: Promo');
  });

  it('clicks inside an iframe within the iframe', async () => {
    await driver.act({ kind: 'click', target: 'Abrir fluxo', value: '' });

    expect(await driver.describe()).toContain('Fluxo aberto');
  });
});
