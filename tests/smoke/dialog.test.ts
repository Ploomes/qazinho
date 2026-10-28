import { mkdtemp } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WebDriver } from '@salve-software/qazinho-harness/engine';

/**
 * "Delete" pergunta antes, com o confirm do próprio navegador, e "Save" avisa com um
 * alert. O Chrome dirigido pelo Playwright fechava os dois em silêncio, como Cancelar: o
 * item nunca era apagado, e o agente nunca sabia que um diálogo tinha estado lá. Depois
 * todo diálogo era respondido com OK, e um passo que cancela uma exclusão só podia ser
 * bloqueado: um clique agora diz como responder ao que abre.
 */
const PAGE = `<!doctype html><html><body>
  <button onclick="document.getElementById('out').textContent = confirm('Delete the item?') ? 'Deleted' : 'Kept'">Delete</button>
  <button onclick="alert('Saved!'); document.getElementById('out').textContent = 'After the alert'">Save</button>
  <button onclick="document.getElementById('out').textContent = 'Named ' + prompt('Name?', 'old name')">Rename</button>
  <p id="out">Nothing yet</p>
</body></html>`;

const PORT = 4342;
const site = createServer((_request, response) => {
  response.writeHead(200, { 'content-type': 'text/html' });
  response.end(PAGE);
});
let driver: WebDriver;

beforeAll(async () => {
  await new Promise<void>((ready) => site.listen(PORT, '127.0.0.1', ready));
  driver = new WebDriver({
    url: `http://127.0.0.1:${String(PORT)}/`,
    profileDir: await mkdtemp(join(tmpdir(), 'qazinho-dialog-')),
  });
  await driver.open();
});

afterAll(async () => {
  await driver.close();
  site.close();
});

describe('a dialog the page opens', () => {
  it('is answered OK, the way a person goes on, and look says what it asked', async () => {
    await driver.act({ kind: 'click', target: 'Delete', value: '' });

    const screen = await driver.describe();

    expect(screen).toContain('Deleted');
    expect(screen).toContain('DIALOGS:\nconfirm: Delete the item? (answered OK)');
  });

  it('tells each dialog once, and an alert by what it said', async () => {
    expect(await driver.describe()).not.toContain('DIALOGS');

    await driver.act({ kind: 'click', target: 'Save', value: '' });

    const screen = await driver.describe();

    expect(screen).toContain('After the alert');
    expect(screen).toContain('alert: Saved!');
  });

  it('is answered Cancel when the click says so, and OK again on the next one', async () => {
    await driver.act({ kind: 'click', target: 'Delete', value: '', dialog: 'cancel' });

    const cancelled = await driver.describe();

    expect(cancelled).toContain('Kept');
    expect(cancelled).toContain('confirm: Delete the item? (answered Cancel)');

    await driver.act({ kind: 'click', target: 'Delete', value: '' });

    expect(await driver.describe()).toContain('(answered OK)');
  });

  it('takes what a prompt asks for from the click that opens it', async () => {
    await driver.act({ kind: 'click', target: 'Rename', value: '', promptText: 'Ana' });

    const named = await driver.describe();

    expect(named).toContain('Named Ana');
    expect(named).toContain('prompt: Name? (answered OK with "Ana")');

    await driver.act({ kind: 'click', target: 'Rename', value: '' });

    expect(await driver.describe()).toContain('Named old name');
  });
});
