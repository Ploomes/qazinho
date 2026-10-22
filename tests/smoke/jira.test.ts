import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Harness } from '@/harness';
import { JiraApi, JiraStories } from '@/main/classes/integrations';
import { fakeJira, JIRA_EMAIL, JIRA_TOKEN } from './fixtures/fakeJira';

const PORT = 4365;
const SITE = `http://127.0.0.1:${String(PORT)}`;

/** A 1×1 PNG, the smallest picture a story can carry. */
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);
const PDF = Buffer.from('%PDF-1.4\n1 0 obj << >> endobj\ntrailer << >>\n%%EOF\n');

const jira = fakeJira({
  files: {
    '10001': { name: 'checkout.png', mimeType: 'image/png', bytes: PNG },
    '10002': { name: 'regras.pdf', mimeType: 'application/pdf', bytes: PDF },
    '10003': {
      name: 'demo.mp4',
      mimeType: 'video/mp4',
      bytes: Buffer.from('not a video'),
    },
  },
});

const signedAs = (token: string) =>
  new JiraApi({
    credentials: () => Promise.resolve({ site: SITE, email: JIRA_EMAIL, token }),
    fetcher: (url, init) => fetch(url, init),
  });

const api = signedAs(JIRA_TOKEN);

beforeAll(async () => {
  await new Promise<void>((ready) => jira.server.listen(PORT, '127.0.0.1', ready));
});

afterAll(() => {
  jira.server.close();
});

describe('Jira as a requirement', () => {
  it('lists the stories to pick from, and the one a typed key names first', async () => {
    expect(await api.search('')).toMatchObject({
      isListed: true,
      issues: [{ key: 'SHOP-12' }, { key: 'SHOP-14' }],
    });
    expect(await api.search('frete')).toMatchObject({
      isListed: true,
      issues: [{ key: 'SHOP-14', summary: 'Frete grátis acima de R$ 200' }],
    });
    expect(await api.search('shop-12')).toMatchObject({
      isListed: true,
      issues: [{ key: 'SHOP-12', url: `${SITE}/browse/SHOP-12` }],
    });
  });

  it('says Jira refused a token it does not know', async () => {
    expect(await signedAs('wrong').search('')).toEqual({
      isListed: false,
      failure: 'unauthorized',
    });
  });

  it('reads the story with its acceptance criteria and comments, and downloads the files it can read', async () => {
    const stories = new JiraStories({
      jira: api,
      root: await mkdtemp(join(tmpdir(), 'qazinho-jira-smoke-')),
    });
    const steps: string[] = [];
    const read = await stories.prepare({
      workspaceId: 'w-1',
      key: 'shop-12',
      onStep: ({ at }) => steps.push(at),
    });

    expect(read.isReady).toBe(true);

    const copy = read.isReady ? read.copy : null;

    expect(copy?.story).toMatchObject({
      key: 'SHOP-12',
      summary: 'Aplicar cupom no checkout',
      acceptance: [
        {
          field: 'Critérios de aceite',
          text: '- SAVE10 tira 10% do total\n- Um cupom expirado é recusado',
        },
      ],
      comments: [{ author: 'Ana PO', text: 'Um cupom por pedido.' }],
    });
    expect(copy?.files.map(({ filename, note }) => `${filename} ${note}`)).toEqual([
      'checkout.png read',
      'regras.pdf read',
      'demo.mp4 not-readable',
    ]);
    expect(await readFile(copy?.files[0]?.path ?? '')).toEqual(PNG);
    expect(steps[0]).toBe('story');
    expect(steps).toContain('files');

    const chat = new Harness().chat({
      text: 'Plan the tests for SHOP-12.',
      told: {},
      target: null,
      viewport: null,
      steps: [],
      references: [],
      runs: [],
      look: null,
      code: null,
      story: copy,
      design: null,
      variables: [],
    });

    expect(chat.prompt).toContain(
      '## The Jira story\nSHOP-12 · Aplicar cupom no checkout',
    );
    expect(chat.prompt).toContain(
      `- checkout.png (image/png, 1 KB) at ${copy?.files[0]?.path ?? ''}`,
    );
    expect(chat.readDirs).toEqual([copy?.root]);
  });

  it('says the story is not there when Jira has no such key', async () => {
    const stories = new JiraStories({
      jira: api,
      root: await mkdtemp(join(tmpdir(), 'qazinho-jira-smoke-')),
    });

    expect(
      await stories.prepare({
        workspaceId: 'w-1',
        key: 'SHOP-99',
        onStep: () => undefined,
      }),
    ).toEqual({ isReady: false, failure: 'not-found' });
  });
});
