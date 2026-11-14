import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { ExampleShop } from '@/main/classes/projects/ExampleShop';

const shops: ExampleShop[] = [];

afterEach(() => {
  for (const shop of shops.splice(0)) shop.stop();
});

const fileOf = async () =>
  join(await mkdtemp(join(tmpdir(), 'qazinho-example-shop-')), 'example-shop.json');

describe('ExampleShop', () => {
  it('opens in loopback, in the QA’s language, and keeps the port it opened on', async () => {
    const file = await fileOf();
    const shop = new ExampleShop({ file });

    shops.push(shop);

    const address = await shop.address('en');
    const page = await fetch(address);

    expect(address).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/\?lang=en$/);
    expect(page.status).toBe(200);
    expect(JSON.parse(await readFile(file, 'utf8'))).toEqual({
      port: Number(new URL(address).port),
    });
  });

  it('comes back on the same port, and opens another when that one is taken', async () => {
    const file = await fileOf();
    const first = new ExampleShop({ file });

    shops.push(first);

    const port = new URL(await first.address('pt')).port;

    first.stop();

    const again = new ExampleShop({ file });

    shops.push(again);
    await again.resume();

    expect(new URL(await again.address('pt')).port).toBe(port);

    const taken = new ExampleShop({ file });

    shops.push(taken);

    expect(new URL(await taken.address('pt')).port).not.toBe(port);
  });

  it('stays down until it opened once', async () => {
    const file = await fileOf();
    const shop = new ExampleShop({ file });

    shops.push(shop);
    await shop.resume();

    await expect(readFile(file, 'utf8')).rejects.toThrow();
  });
});
