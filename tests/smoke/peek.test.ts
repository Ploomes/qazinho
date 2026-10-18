import type { AddressInfo } from 'node:net';
import { mkdtemp, readdir } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AppPeek } from '@/main/classes/devices/AppPeek';

const PAGE = `<!doctype html><html><head><title>Rotuz</title></head><body>
  <h1>The score of what you eat</h1>
  <p>Point the camera at the label.</p>
  <a href="/premium">Premium</a>
</body></html>`;

/**
 * The chat's first look at a web app: a real Chrome opens the page for a moment, so the agent
 * asks about what the app shows instead of asking what it is.
 */
describe('a look at the app before the chat', () => {
  it('reads what the page shows, and keeps it for the next message', async () => {
    const site = createServer((_request, response) => {
      response.writeHead(200, { 'content-type': 'text/html' });
      response.end(PAGE);
    });

    await new Promise<void>((ready) => site.listen(4331, '127.0.0.1', ready));

    const folder = await mkdtemp(join(tmpdir(), 'qazinho-peek-'));
    const peek = new AppPeek({ folder });
    const look = await peek.look('http://127.0.0.1:4331/');

    expect(look).toMatchObject({ url: 'http://127.0.0.1:4331/', isOpen: true });
    expect(look.isOpen && look.page).toContain('TITLE: Rotuz');
    expect(look.isOpen && look.page).toContain('The score of what you eat');
    expect(look.isOpen && look.page).toContain('a: Premium');
    expect(await peek.look('http://127.0.0.1:4331/')).toBe(look);
    expect(await readdir(folder)).toEqual([]);

    site.close();
  });

  it('says why a page did not open, and tries again the next time', async () => {
    const closed = createServer();

    await new Promise<void>((ready) => closed.listen(0, '127.0.0.1', ready));

    const { port } = closed.address() as AddressInfo;

    await new Promise((done) => closed.close(done));

    const url = `http://127.0.0.1:${String(port)}/`;
    const peek = new AppPeek({ folder: await mkdtemp(join(tmpdir(), 'qazinho-peek-')) });
    const first = await peek.look(url);

    expect(first).toMatchObject({ isOpen: false });
    expect(!first.isOpen && first.reason).toMatch(/ERR_CONNECTION_REFUSED/);
    expect(await peek.look(url)).not.toBe(first);
  });
});
