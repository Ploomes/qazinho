import type { SiteFetcher } from '@/main/classes/projects/SiteIcons/types';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SiteIcons } from '@/main/classes/projects/SiteIcons';

const DAY = 24 * 60 * 60 * 1000;
const PNG = new Uint8Array([137, 80, 78, 71]);
const PNG_URL = 'data:image/png;base64,iVBORw==';

/** Um site fake: cada endereço responde o que a tabela diz, e o resto é um 404. */
function fakeSite(pages: Record<string, { type: string; body: string | Uint8Array }>) {
  const asked: string[] = [];
  const fetcher: SiteFetcher = (url) => {
    asked.push(url);

    const page = pages[url];

    if (page === undefined)
      return Promise.resolve({
        ok: false,
        headers: { get: () => null },
        text: () => Promise.resolve(''),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      });

    const bytes =
      typeof page.body === 'string' ? new TextEncoder().encode(page.body) : page.body;

    return Promise.resolve({
      ok: true,
      headers: { get: (name) => (name === 'content-type' ? page.type : null) },
      text: () => Promise.resolve(new TextDecoder().decode(bytes)),
      arrayBuffer: () => Promise.resolve(bytes.slice().buffer),
    });
  };

  return { asked, fetcher };
}

let folder = '';
let file = '';

beforeEach(async () => {
  folder = await mkdtemp(join(tmpdir(), 'site-icons-'));
  file = join(folder, 'site-icons.json');
});

afterEach(async () => {
  await rm(folder, { recursive: true, force: true });
});

describe('SiteIcons', () => {
  it('reads the icon the page declares and hands it over as a data URL', async () => {
    const { fetcher } = fakeSite({
      'https://loja.test/carrinho': {
        type: 'text/html',
        body: '<link rel="icon" href="/brand.png">',
      },
      'https://loja.test/brand.png': { type: 'image/png', body: PNG },
    });
    const icons = new SiteIcons({ fetcher, file, now: () => 0 });

    expect(await icons.of('https://loja.test/carrinho')).toBe(PNG_URL);
  });

  it('falls back to the favicon of the origin when the page declares none', async () => {
    const { fetcher } = fakeSite({
      'https://loja.test/': { type: 'text/html', body: '<title>Loja</title>' },
      'https://loja.test/favicon.ico': { type: 'image/x-icon', body: PNG },
    });
    const icons = new SiteIcons({ fetcher, file, now: () => 0 });

    expect(await icons.of('https://loja.test/')).toBe(
      'data:image/x-icon;base64,iVBORw==',
    );
  });

  /** Um SPA responde a página em qualquer caminho: ela nunca vira o ícone. */
  it('gives nothing when every candidate answers with something that is not an image', async () => {
    const { fetcher } = fakeSite({
      'https://loja.test/': { type: 'text/html', body: '<div id="root"></div>' },
      'https://loja.test/favicon.ico': {
        type: 'text/html',
        body: '<div id="root"></div>',
      },
    });
    const icons = new SiteIcons({ fetcher, file, now: () => 0 });

    expect(await icons.of('https://loja.test/')).toBeNull();
  });

  it('does NOT reach for anything when the target is a build, not a site', async () => {
    const { asked, fetcher } = fakeSite({});
    const icons = new SiteIcons({ fetcher, file, now: () => 0 });

    expect(await icons.of('/Users/qa/builds/loja.apk')).toBeNull();
    expect(asked).toEqual([]);
  });

  it('keeps the icon on disk, so the next start asks the site nothing', async () => {
    const site = fakeSite({
      'https://loja.test/': { type: 'text/html', body: '' },
      'https://loja.test/favicon.ico': { type: 'image/png', body: PNG },
    });

    await new SiteIcons({ fetcher: site.fetcher, file, now: () => 0 }).of(
      'https://loja.test/',
    );

    const again = fakeSite({});
    const icon = await new SiteIcons({ fetcher: again.fetcher, file, now: () => DAY }).of(
      'https://loja.test/carrinho',
    );

    expect(icon).toBe(PNG_URL);
    expect(again.asked).toEqual([]);
    expect(JSON.parse(await readFile(file, 'utf8'))).toEqual({
      'https://loja.test': { icon: PNG_URL, at: 0 },
    });
  });

  it('asks again a day after a site had no icon, and a week after it had one', async () => {
    let now = 0;
    const site = fakeSite({});
    const icons = new SiteIcons({ fetcher: site.fetcher, file, now: () => now });

    await icons.of('https://loja.test/');
    const first = site.asked.length;

    now = DAY - 1;
    await icons.of('https://loja.test/');
    expect(site.asked).toHaveLength(first);

    now = DAY;
    await icons.of('https://loja.test/');
    expect(site.asked.length).toBeGreaterThan(first);
  });

  /** Uma VPN caída não apaga o ícone que o projeto já mostrava. */
  it('keeps the icon it had when the site cannot be reached', async () => {
    await writeFile(
      file,
      JSON.stringify({ 'https://loja.test': { icon: PNG_URL, at: 0 } }),
    );

    const icons = new SiteIcons({
      fetcher: fakeSite({}).fetcher,
      file,
      now: () => 8 * DAY,
    });

    expect(await icons.of('https://loja.test/')).toBe(PNG_URL);
  });

  it('asks the site once when two rows want the same icon at the same time', async () => {
    const site = fakeSite({
      'https://loja.test/': { type: 'text/html', body: '' },
      'https://loja.test/favicon.ico': { type: 'image/png', body: PNG },
    });
    const icons = new SiteIcons({ fetcher: site.fetcher, file, now: () => 0 });

    const [a, b] = await Promise.all([
      icons.of('https://loja.test/'),
      icons.of('https://loja.test/busca'),
    ]);

    expect([a, b]).toEqual([PNG_URL, PNG_URL]);
    expect(site.asked.filter((url) => url.endsWith('favicon.ico'))).toHaveLength(1);
  });

  it('does NOT take an icon heavier than the limit', async () => {
    const { fetcher } = fakeSite({
      'https://loja.test/': { type: 'text/html', body: '' },
      'https://loja.test/favicon.ico': {
        type: 'image/png',
        body: new Uint8Array(300_000),
      },
    });

    expect(
      await new SiteIcons({ fetcher, file, now: () => 0 }).of('https://loja.test/'),
    ).toBeNull();
  });
});
