import type { IFilingEvent } from '@/shared/types';
import { chmod, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { BugFiler, GithubCli, JiraApi } from '@/main/classes/integrations';
import { fakeJira, JIRA_EMAIL, JIRA_TOKEN } from './fixtures/fakeJira';

const PORT = 4371;
const SITE = `http://127.0.0.1:${String(PORT)}`;

/** Um PNG de 1×1, a menor tela que um bug pode levar. */
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

/**
 * O gh como responde a uma issue sendo aberta: o rótulo bug que um repositório tem, a
 * issue que ele fez, e um repositório com as issues desligadas, que o GitHub responde com
 * 410. Toda chamada é anotada com os argumentos, cada um terminado por um separador de
 * registro, já que um corpo passa de uma linha.
 */
const FAKE_GH = String.raw`#!/bin/bash
ROOT="$(cd "$(dirname "$0")" && pwd)"
LAST="$${'{@: -1}'}"
printf '%s\0' "$@" >> "$ROOT/asked"
printf '\036' >> "$ROOT/asked"
case "$LAST" in
  repos/acme/shop/labels/bug)
    echo '{"name":"bug"}'
    ;;
  repos/acme/shop/issues)
    echo '{"number":42,"html_url":"https://github.com/acme/shop/issues/42"}'
    ;;
  repos/acme/closed/issues)
    echo '{"message":"Issues are disabled for this repo"}'
    echo "gh: Issues are disabled for this repo (HTTP 410)" >&2
    exit 1
    ;;
  *)
    echo '{"message":"Not Found"}'
    echo "gh: Not Found (HTTP 404)" >&2
    exit 1
    ;;
esac
`;

const REPORT = {
  title: 'An expired coupon is taken',
  blocks: [
    { kind: 'paragraph' as const, text: 'The checkout took EXPIRED.' },
    {
      kind: 'steps' as const,
      items: [
        { text: 'Open the cart', isBad: false },
        { text: 'Apply EXPIRED', isBad: true },
      ],
    },
  ],
};

const jira = fakeJira({ files: {} });
let folder = '';
let gh = '';

function filer() {
  const events: IFilingEvent[] = [];

  return {
    events,
    filer: new BugFiler({
      jira: new JiraApi({
        credentials: () =>
          Promise.resolve({ site: SITE, email: JIRA_EMAIL, token: JIRA_TOKEN }),
        fetcher: (url, init) => fetch(url, init),
      }),
      github: new GithubCli({
        directories: () => Promise.resolve([gh]),
        onProgress: () => undefined,
      }),
      readShot: (shot) =>
        shot.file === null
          ? Promise.resolve(null)
          : readFile(shot.file).catch(() => null),
      recordingOf: () => Promise.resolve(join(folder, 'run.webm')),
      onEvent: (event) => events.push(event),
      now: () => new Date('2026-10-22T12:00:00.000Z'),
    }),
  };
}

beforeAll(async () => {
  await new Promise<void>((ready) => jira.server.listen(PORT, '127.0.0.1', ready));
  folder = await mkdtemp(join(tmpdir(), 'qazinho-filing-'));
  gh = await mkdtemp(join(tmpdir(), 'qazinho-filing-gh-'));
  await writeFile(join(folder, 'broke.png'), PNG);
  await writeFile(join(folder, 'run.webm'), Buffer.alloc(2_048, 1));
  await writeFile(join(gh, 'gh'), FAKE_GH);
  await chmod(join(gh, 'gh'), 0o755);
});

afterAll(() => {
  jira.server.close();
});

describe('a bug sent to the QA’s tracker', () => {
  it('becomes a Jira Bug with its screen and recording attached, linked to its story', async () => {
    const { filer: bugs, events } = filer();
    const filed = await bugs.file({
      filingId: 'f-1',
      target: { tracker: 'jira', project: 'SHOP' },
      story: 'SHOP-12',
      report: REPORT,
      shots: [{ name: 'BUG-02 broke', file: join(folder, 'broke.png'), src: null }],
      video: {
        kind: 'recording',
        name: 'BUG-02 r-03 recording',
        run: { workspaceId: 'w-1', runId: 'r-03' },
      },
    });

    expect(filed).toEqual({
      isFiled: true,
      issue: {
        tracker: 'jira',
        key: 'SHOP-57',
        url: `${SITE}/browse/SHOP-57`,
        at: '2026-10-22T12:00:00.000Z',
      },
      missed: [],
      linked: 'SHOP-12',
    });
    expect(jira.created).toEqual([
      expect.objectContaining({ project: 'SHOP', type: '10004', summary: REPORT.title }),
    ]);
    expect(jira.attached).toEqual([
      {
        key: 'SHOP-57',
        filename: 'BUG-02 broke.png',
        contentType: 'image/png',
        bytes: PNG.length,
      },
      {
        key: 'SHOP-57',
        filename: 'BUG-02 r-03 recording.webm',
        contentType: 'video/webm',
        bytes: 2_048,
      },
    ]);
    expect(jira.linked).toEqual([
      { type: 'Relates', inward: 'SHOP-57', outward: 'SHOP-12' },
    ]);
    expect(
      events.filter(({ state }) => state === 'done').map(({ step }) => step),
    ).toEqual(['issue', 'screens', 'video', 'link']);
  });

  it('says in Jira’s words why a project would not take it', async () => {
    expect(
      await filer().filer.file({
        filingId: 'f-2',
        target: { tracker: 'jira', project: 'LOCKED' },
        story: null,
        report: REPORT,
        shots: [],
        video: null,
      }),
    ).toEqual({ isFiled: false, failure: 'rejected', said: 'Component/s is required.' });
  });

  it('becomes a GitHub issue through gh, written in Markdown and labelled a bug', async () => {
    const filed = await filer().filer.file({
      filingId: 'f-3',
      target: { tracker: 'github', owner: 'acme', name: 'shop' },
      story: null,
      report: REPORT,
      shots: [],
      video: null,
    });

    expect(filed).toMatchObject({
      isFiled: true,
      issue: {
        tracker: 'github',
        key: '#42',
        url: 'https://github.com/acme/shop/issues/42',
      },
    });

    const calls = (await readFile(join(gh, 'asked'), 'utf8'))
      .split('\u001e')
      .filter((call) => call !== '')
      .map((call) => call.split('\0').filter((arg) => arg !== ''));
    const opened = calls.find((args) => args.at(-1) === 'repos/acme/shop/issues');

    expect(opened).toEqual([
      'api',
      '--method',
      'POST',
      '--raw-field',
      'title=An expired coupon is taken',
      '--raw-field',
      'body=The checkout took EXPIRED.\n\n1. Open the cart\n2. **Apply EXPIRED**',
      '--raw-field',
      'labels[]=bug',
      'repos/acme/shop/issues',
    ]);
  });

  it('says why GitHub would not take it, in gh’s words', async () => {
    expect(
      await filer().filer.file({
        filingId: 'f-4',
        target: { tracker: 'github', owner: 'acme', name: 'closed' },
        story: null,
        report: REPORT,
        shots: [],
        video: null,
      }),
    ).toEqual({
      isFiled: false,
      failure: 'rejected',
      said: 'gh: Issues are disabled for this repo (HTTP 410)',
    });
  });
});
