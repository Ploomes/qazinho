import type { IReviewBug } from '@/shared/types';
import { chmod, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Harness } from '@/harness';
import { AgentRunner } from '@/main/classes/agents/AgentRunner';
import { BugFiler, BugReviewer, GithubCli, JiraApi } from '@/main/classes/integrations';
import { ProcessOwners } from '@/main/classes/resources/ProcessOwners';
import { fakeJira, JIRA_EMAIL, JIRA_TOKEN } from './fixtures/fakeJira';

const PORT = 4374;
const SITE = `http://127.0.0.1:${String(PORT)}`;

/**
 * Claude Code as the reporter meets it: it writes down how it was called and what it read, and
 * answers in the schema. A message that names a new screen is news, anything else nothing new.
 */
const REPORTER = `#!/usr/bin/env node
const { appendFileSync } = require('node:fs');
const { join } = require('node:path');
let prompt = '';
process.stdin.on('data', (chunk) => { prompt += chunk; });
process.stdin.on('end', () => {
  appendFileSync(join(__dirname, 'calls.json'), JSON.stringify({ argv: process.argv.slice(2), prompt }) + '\\n');
  const isNew = prompt.includes('Its screen:') && !prompt.includes('Taken on mobile');
  const answer = isNew
    ? { verdict: 'news', reason: 'It breaks on mobile too.', comment: 'Taken on mobile too, at 390 × 844.' }
    : { verdict: 'nothing-new', reason: 'The issue already tells it.', comment: '' };
  const say = (line) => console.log(JSON.stringify(line));
  say({ type: 'system', subtype: 'init', session_id: 's1' });
  say({ type: 'assistant', session_id: 's1', message: { content: [{ type: 'tool_use', name: 'StructuredOutput', input: answer }] } });
  say({ type: 'result', subtype: 'success', is_error: false, result: '', session_id: 's1', total_cost_usd: 0.002 });
});
`;

const jira = fakeJira({ files: {} });
let bin = '';
let runs = '';

const api = new JiraApi({
  credentials: () =>
    Promise.resolve({ site: SITE, email: JIRA_EMAIL, token: JIRA_TOKEN }),
  fetcher: (url, init) => fetch(url, init),
});
const filer = () =>
  new BugFiler({
    jira: api,
    github: new GithubCli({
      directories: () => Promise.resolve([]),
      onProgress: () => undefined,
    }),
    readShot: () => Promise.resolve(null),
    recordingOf: () => Promise.resolve(null),
    onEvent: () => undefined,
    now: () => new Date('2026-10-22T12:00:00.000Z'),
  });

const reviewer = () =>
  new BugReviewer({
    filer: filer(),
    runner: new AgentRunner({
      owners: new ProcessOwners(),
      folder: tmpdir(),
      onEvent: () => undefined,
    }),
    harness: new Harness(),
    findCommand: () => Promise.resolve(join(bin, 'claude')),
    runsRoot: runs,
  });

const ask = (issue: IReviewBug['issue']): IReviewBug => ({
  workspaceId: 'w-1',
  bugId: 'BUG-02',
  agentId: 'claude-code',
  model: '',
  language: 'pt',
  issue,
  bug: {
    title: 'Cupom expirado é aceito',
    expected: 'Este cupom expirou',
    got: 'R$ 90,00',
    body: '',
    caseTitle: 'Um cupom expirado é recusado',
  },
  sightings: [
    {
      runId: 'r-05',
      runWhen: '14:02',
      caseId: 'TC-02',
      stepNumber: 2,
      action: 'Aplicar o cupom EXPIRED',
      note: 'Aceito no celular.',
      target: 'Web · Chrome 390 × 844',
      shot: join(runs, 'w-1', 'r-05', 'step-2.jpg'),
      requests: [],
    },
  ],
});

const calls = async () =>
  (await readFile(join(bin, 'calls.json'), 'utf8'))
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line) as { argv: string[]; prompt: string });

beforeAll(async () => {
  await new Promise<void>((ready) => jira.server.listen(PORT, '127.0.0.1', ready));
  bin = await mkdtemp(join(tmpdir(), 'qazinho-review-bin-'));
  runs = join(await mkdtemp(join(tmpdir(), 'qazinho-review-data-')), 'runs');
  await mkdir(join(runs, 'w-1', 'r-05'), { recursive: true });
  await writeFile(join(runs, 'w-1', 'r-05', 'step-2.jpg'), 'jpeg');
  await writeFile(join(bin, 'claude'), REPORTER);
  await chmod(join(bin, 'claude'), 0o755);
});

afterAll(() => {
  jira.server.close();
});

describe('a filed bug seen again', () => {
  it('is weighed by the QA’s agent against its issue, read only on the runs, and the update goes under it', async () => {
    const filed = await filer().file({
      filingId: 'f-1',
      target: { tracker: 'jira', project: 'SHOP' },
      story: null,
      report: {
        title: 'Cupom expirado é aceito',
        blocks: [{ kind: 'paragraph', text: 'O total cai.' }],
      },
      shots: [],
      video: null,
    });

    expect(filed.isFiled).toBe(true);

    const issue = filed.isFiled ? filed.issue : null;
    const review = await reviewer().review(ask(issue!));

    expect(review).toEqual({
      isReviewed: true,
      verdict: 'news',
      reason: 'It breaks on mobile too.',
      comment: 'Taken on mobile too, at 390 × 844.',
    });

    const [call] = await calls();

    expect(call?.argv).toEqual(
      expect.arrayContaining([
        '--tools',
        'Read,Grep,Glob',
        '--add-dir',
        join(runs, 'w-1'),
      ]),
    );
    expect(call?.argv).toContain('--json-schema');
    expect(call?.prompt).toContain('## The issue\nSHOP-57 · Cupom expirado é aceito');
    expect(call?.prompt).toContain(
      `Its screen: ${join(runs, 'w-1', 'r-05', 'step-2.jpg')}`,
    );

    expect(
      await filer().comment({
        issue: issue!,
        report: {
          title: '',
          blocks: [{ kind: 'paragraph', text: 'Taken on mobile too, at 390 × 844.' }],
        },
        shots: [],
        video: null,
      }),
    ).toEqual({
      isPosted: true,
      url: `${SITE}/browse/SHOP-57?focusedCommentId=1001`,
      missed: [],
    });
    expect(jira.commented.map(({ key }) => key)).toEqual(['SHOP-57']);

    expect(await reviewer().review(ask(issue!))).toMatchObject({
      isReviewed: true,
      verdict: 'nothing-new',
    });
    expect((await calls())[1]?.prompt).toContain(
      'Ana QA, : Taken on mobile too, at 390 × 844.',
    );
  });
});
