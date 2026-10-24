import type { ProAnswer } from '@/main/classes/pro/ProApi';
import type { IProSync } from '@/main/classes/pro/ProSync';
import type { IProShare, IProSyncBatch } from '@/shared/types';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { ProSync } from '@/main/classes/pro/ProSync';

type Method = keyof IProSync['api'];

interface ISent {
  method: Method;
  org: string;
  path: string;
  body: unknown;
}

type Refusal = { isOk: false; status: number; error: string; details?: unknown };

/** The org's plan as another QA left it: version 4, by Bruno. */
const MOVED = {
  version: 4,
  cases: [
    {
      id: 'c1',
      title: 'Pagar com Pix e cartão',
      priority: 'P1' as const,
      goal: 'Pagar',
      preconditions: '',
      steps: [{ action: 'Copiar o código Pix', expected: 'O código é copiado' }],
    },
  ],
  editedBy: 'Bruno',
  editedAt: '2026-10-24T11:30:00.000Z',
};

/** The platform as the sync calls it: every call is kept, and answered as `refuse` says or as the platform would. */
function fakeApi(refuse: (sent: ISent) => Refusal | null = () => null) {
  const sent: ISent[] = [];
  let versions = 0;
  let uploads = 0;

  function answer<T>(props: { call: ISent; value: T }): Promise<ProAnswer<T>> {
    sent.push(props.call);

    return Promise.resolve<ProAnswer<T>>(
      refuse(props.call) ?? { isOk: true, value: props.value },
    );
  }

  const api: IProSync['api'] = {
    syncProject: ({ org, path, body }) =>
      answer({
        call: { method: 'syncProject', org, path, body },
        value: { project: { id: 'project-org', key: 'LOJA', name: 'Loja' } },
      }),
    syncPlan: ({ org, path, body }) => {
      versions += 1;

      return answer({
        call: { method: 'syncPlan', org, path, body },
        value: { plan: { id: 'plan-org', version: versions } },
      });
    },
    syncRun: ({ org, path, body }) =>
      answer({
        call: { method: 'syncRun', org, path, body },
        value: { run: { id: 'run-org', number: 1 } },
      }),
    syncBug: ({ org, path, body }) =>
      answer({
        call: { method: 'syncBug', org, path, body },
        value: { bug: { id: 'bug-org', label: 'LOJA-1' } },
      }),
    syncRecordings: ({ org, path, body }) =>
      answer({ call: { method: 'syncRecordings', org, path, body }, value: null }),
    evidenceUpload: ({ org, path, body }) => {
      uploads += 1;

      return answer({
        call: { method: 'evidenceUpload', org, path, body },
        value: {
          key: `ev/${String(uploads)}`,
          uploadUrl: `https://evidence.test/${String(uploads)}`,
          headers: { 'content-type': 'image/jpeg' },
        },
      });
    },
  };

  return { api, sent, methods: () => sent.map(({ method }) => method) };
}

/** A shared project with one plan, a run that left a screen and a video, and the bug it found. */
function batchOf(root: string): IProSyncBatch {
  const shot = join(root, 'runs', 'w1', 'r1', '2.jpg');

  return {
    project: {
      projectId: 'p1',
      name: 'Loja — staging',
      targets: [
        { id: 't1', kind: 'web', label: 'staging', value: 'https://staging.loja.dev' },
      ],
      repositories: [],
    },
    plans: [
      {
        workspaceId: 'w1',
        name: 'Checkout com Pix',
        targetId: 't1',
        targetKind: 'web',
        issue: null,
        design: null,
        cases: [
          {
            id: 'c1',
            title: 'Pagar com Pix',
            priority: 'P1',
            goal: 'Pagar com Pix',
            preconditions: '',
            steps: [{ action: 'Copiar o código Pix', expected: 'O código é copiado' }],
          },
        ],
      },
    ],
    runs: [
      {
        workspaceId: 'w1',
        runId: 'r1',
        kind: 'run',
        startedAt: '2026-10-24T10:00:00.000Z',
        durationSec: 40,
        endedBy: 'finished',
        target: { kind: 'web', label: 'staging', value: 'https://staging.loja.dev' },
        counts: { passed: 0, failed: 1, blocked: 0, skipped: 0 },
        cases: [
          {
            id: 'c1',
            title: 'Pagar com Pix',
            verdict: 'failed',
            durationSec: 40,
            steps: [
              {
                number: 1,
                action: 'Copiar o código Pix',
                verdict: 'failed',
                why: 'O botão não apareceu',
                bugId: 'b1',
                shotFile: shot,
                by: 'agent',
                proof: null,
              },
            ],
          },
        ],
        costUsd: 0.02,
      },
    ],
    bugs: [
      {
        workspaceId: 'w1',
        bugId: 'b1',
        severity: 'high',
        title: 'O código Pix não aparece',
        body: '',
        expected: 'O código é copiado',
        got: 'Nada aparece',
        caseId: 'c1',
        caseTitle: 'Pagar com Pix',
        stepNumber: 1,
        target: 'https://staging.loja.dev',
        isIncidental: false,
        isDismissed: false,
        filed: null,
        repro: [{ action: 'Copiar o código Pix', isBad: true }],
        shots: [{ file: shot, isBad: true }],
        sightings: [],
        firstSeenAt: '2026-10-24T10:00:30.000Z',
      },
    ],
  };
}

async function syncWith(props: {
  api: IProSync['api'];
  orgSlug?: string | null;
  videoOf?: (root: string) => IProSync['videoOf'];
}) {
  const root = await mkdtemp(join(tmpdir(), 'qazinho-sync-'));
  const target = { orgSlug: props.orgSlug === undefined ? 'loja' : props.orgSlug };
  const runFolder = join(root, 'runs', 'w1', 'r1');
  const uploaded: string[] = [];
  const upload = { isTaken: true };
  const retries: { ms: number; run: () => void; isCancelled: boolean }[] = [];
  const shares: IProShare[] = [];

  await mkdir(runFolder, { recursive: true });
  await writeFile(join(runFolder, '2.jpg'), 'jpeg');
  await writeFile(join(runFolder, 'run.mp4'), 'mp4');
  await mkdir(join(root, 'workspaces', 'w1'), { recursive: true });
  await writeFile(
    join(root, 'workspaces', 'w1', 'recipes.json'),
    JSON.stringify({
      cases: [
        {
          caseId: 'c1',
          fingerprint: 'fp',
          targetKind: 'web',
          steps: [],
          runId: 'r1',
          recordedAt: 0,
        },
      ],
    }),
  );

  const sync = new ProSync({
    api: props.api,
    target: () =>
      Promise.resolve(
        target.orgSlug === null ? null : { token: 'qzm_secret', orgSlug: target.orgSlug },
      ),
    machineName: 'MacBook-Ana',
    file: join(root, 'pro', 'sync.json'),
    archiveRoot: root,
    videoOf:
      props.videoOf?.(root) ??
      (({ runId }) =>
        Promise.resolve(
          runId === 'r1' ? join(root, 'runs', 'w1', 'r1', 'run.mp4') : null,
        )),
    variablesOf: () =>
      Promise.resolve([{ name: 'LOGIN_PASSWORD', description: 'senha do QA' }]),
    upload: ({ file }) => {
      uploaded.push(file);

      return Promise.resolve(upload.isTaken);
    },
    now: () => new Date('2026-10-24T12:00:00.000Z'),
    schedule: ({ ms, run }) => {
      const retry = { ms, run, isCancelled: false };

      retries.push(retry);

      return () => {
        retry.isCancelled = true;
      };
    },
    onShare: (share) => {
      shares.push(share);
    },
  });

  return { sync, root, target, uploaded, upload, retries, shares, batch: batchOf(root) };
}

describe('ProSync', () => {
  it('sends nothing while signed out, or with no org to send to', async () => {
    const { api, sent } = fakeApi();
    const { sync, batch } = await syncWith({ api, orgSlug: null });

    expect(await sync.push(batch)).toMatchObject({ projectId: 'p1', state: 'off' });
    expect(sent).toEqual([]);
    expect(await sync.shares()).toEqual([]);
  });

  it('sends a project the first time whole, its screens before what names them', async () => {
    const { api, sent, methods } = fakeApi();
    const { sync, batch, root, uploaded, shares } = await syncWith({ api });

    const pushed = await sync.push(batch);

    expect(methods()).toEqual([
      'syncProject',
      'syncPlan',
      'evidenceUpload',
      'evidenceUpload',
      'syncRun',
      'syncBug',
      'syncRecordings',
    ]);
    expect(pushed).toEqual({
      projectId: 'p1',
      orgSlug: 'loja',
      state: 'synced',
      syncedAt: '2026-10-24T12:00:00.000Z',
      conflicts: [],
    });
    expect(shares.map(({ state }) => state)).toEqual(['sending', 'synced']);
    expect(uploaded).toEqual([
      join(root, 'runs', 'w1', 'r1', '2.jpg'),
      join(root, 'runs', 'w1', 'r1', 'run.mp4'),
    ]);
    expect(sent[0]).toMatchObject({
      org: 'loja',
      path: 'projects/p1',
      body: { variables: [{ name: 'LOGIN_PASSWORD', description: 'senha do QA' }] },
    });
    expect(sent[1]).toMatchObject({
      path: 'projects/p1/plans/w1',
      body: { name: 'Checkout com Pix', baseVersion: null, machine: 'MacBook-Ana' },
    });
    expect(sent[2]?.body).toEqual({
      kind: 'screenshot',
      contentType: 'image/jpeg',
      size: 4,
      sha256: expect.any(String) as string,
    });
    expect(sent[4]).toMatchObject({
      path: 'plans/plan-org/runs/r1',
      body: { video: 'ev/2', cases: [{ steps: [{ shot: 'ev/1' }] }] },
    });
    expect(sent[5]).toMatchObject({
      path: 'plans/plan-org/bugs/b1',
      body: { shots: [{ key: 'ev/1', isBad: true }] },
    });
    expect(sent[6]).toMatchObject({
      path: 'plans/plan-org/recordings',
      body: { branch: 'main', recordings: [{ caseId: 'c1', fingerprint: 'fp' }] },
    });
  });

  it('sends nothing the org already has', async () => {
    const { api, methods } = fakeApi();
    const { sync, batch, uploaded } = await syncWith({ api });

    await sync.push(batch);
    const before = methods().length;

    expect(await sync.push(batch)).toMatchObject({ state: 'synced' });
    expect(methods()).toHaveLength(before);
    expect(uploaded).toHaveLength(2);
  });

  it('sends only what changed, from the version the org last took', async () => {
    const { api, sent, methods } = fakeApi();
    const { sync, batch } = await syncWith({ api });

    await sync.push(batch);
    const before = methods().length;

    await sync.push({
      ...batch,
      plans: batch.plans.map((plan) => ({ ...plan, name: 'Checkout com Pix e cartão' })),
    });

    expect(methods().slice(before)).toEqual(['syncPlan']);
    expect(sent.at(-1)?.body).toMatchObject({ baseVersion: 1 });
  });

  it('keeps a plan the org moved since as a conflict, with what both started from, and still sends the rest', async () => {
    let isMoved = false;
    const { api, methods } = fakeApi((sent) =>
      isMoved && sent.method === 'syncPlan'
        ? { isOk: false, status: 409, error: 'plan_conflict', details: MOVED }
        : null,
    );
    const { sync, batch } = await syncWith({ api });

    await sync.push(batch);
    isMoved = true;
    const before = methods().length;

    const pushed = await sync.push({
      ...batch,
      plans: batch.plans.map((plan) => ({ ...plan, name: 'Checkout novo' })),
      runs: batch.runs.map((run) => ({ ...run, runId: 'r2' })),
    });

    expect(pushed).toMatchObject({
      state: 'conflict',
      conflicts: [
        {
          workspaceId: 'w1',
          base: batch.plans[0]?.cases,
          version: 4,
          cases: MOVED.cases,
          editedBy: 'Bruno',
        },
      ],
    });
    expect(methods().slice(before)).toEqual(['syncPlan', 'syncRun']);
  });

  it('calls a conflict it cannot read a failure, rather than guess the org’s plan', async () => {
    let isMoved = false;
    const { api } = fakeApi((sent) =>
      isMoved && sent.method === 'syncPlan'
        ? { isOk: false, status: 409, error: 'plan_conflict' }
        : null,
    );
    const { sync, batch } = await syncWith({ api });

    await sync.push(batch);
    isMoved = true;

    expect(
      await sync.push({
        ...batch,
        plans: batch.plans.map((plan) => ({ ...plan, name: 'Checkout novo' })),
      }),
    ).toMatchObject({ state: 'failed', conflicts: [] });
  });

  it('holds a plan waiting on the QA, and sends it from the org’s version once merged', async () => {
    let isMoved = false;
    const { api, sent, methods } = fakeApi((call) =>
      isMoved && call.method === 'syncPlan'
        ? { isOk: false, status: 409, error: 'plan_conflict', details: MOVED }
        : null,
    );
    const { sync, batch } = await syncWith({ api });
    const renamed = {
      ...batch,
      plans: batch.plans.map((plan) => ({ ...plan, name: 'Checkout novo' })),
    };

    await sync.push(batch);
    isMoved = true;
    await sync.push(renamed);
    const before = methods().length;

    await sync.push({
      ...renamed,
      plans: renamed.plans.map((plan) => ({ ...plan, name: 'Outro' })),
    });

    expect(methods().slice(before)).toEqual([]);

    isMoved = false;

    expect(
      await sync.resolve({ projectId: 'p1', workspaceId: 'w1', version: 3 }),
    ).toMatchObject({
      state: 'conflict',
    });
    expect(
      await sync.resolve({ projectId: 'p1', workspaceId: 'w1', version: 4 }),
    ).toMatchObject({
      state: 'sending',
      conflicts: [],
    });
    expect(await sync.push(renamed)).toMatchObject({ state: 'synced', conflicts: [] });
    expect(sent.at(-1)).toMatchObject({ method: 'syncPlan', body: { baseVersion: 4 } });
  });

  it('keeps a project downloaded from its org as shared, each plan at the version it came in', async () => {
    const { api, sent } = fakeApi();
    const { sync, batch, shares } = await syncWith({ api });

    expect(
      await sync.adopt({
        projectId: 'p1',
        orgSlug: 'loja',
        plans: [
          { workspaceId: 'w1', planId: 'plan-org', version: 7, cases: MOVED.cases },
        ],
      }),
    ).toMatchObject({ orgSlug: 'loja', state: 'synced', conflicts: [] });
    expect(shares.at(-1)).toMatchObject({ orgSlug: 'loja', state: 'synced' });

    await sync.push(batch);

    expect(sent.find(({ method }) => method === 'syncPlan')).toMatchObject({
      body: { baseVersion: 7 },
    });
    expect(sent.find(({ method }) => method === 'syncRun')?.path).toBe(
      'plans/plan-org/runs/r1',
    );
  });

  it('sends two workspaces’ runs and bugs that share an id, each to its own plan', async () => {
    const { api, sent } = fakeApi();
    const { sync, batch } = await syncWith({ api });
    const other = { ...batch.plans[0]!, workspaceId: 'w2' };

    await sync.push({
      ...batch,
      plans: [...batch.plans, other],
      runs: [...batch.runs, ...batch.runs.map((run) => ({ ...run, workspaceId: 'w2' }))],
      bugs: [...batch.bugs, ...batch.bugs.map((bug) => ({ ...bug, workspaceId: 'w2' }))],
    });

    expect(sent.filter(({ method }) => method === 'syncRun')).toHaveLength(2);
    expect(sent.filter(({ method }) => method === 'syncBug')).toHaveLength(2);
  });

  it('waits for the network, and tries again on its own a minute later', async () => {
    let isDown = true;
    const { api } = fakeApi(() =>
      isDown ? { isOk: false, status: 0, error: 'unreachable' } : null,
    );
    const { sync, batch, retries, shares } = await syncWith({ api });

    expect(await sync.push(batch)).toMatchObject({ state: 'waiting', syncedAt: null });
    expect(retries).toMatchObject([{ ms: 60_000, isCancelled: false }]);

    isDown = false;
    retries[0]?.run();

    await vi.waitFor(() => {
      expect(shares.at(-1)).toMatchObject({ state: 'synced' });
    });
  });

  it('drops a waiting retry once the project is pushed again', async () => {
    const { api } = fakeApi(() => ({
      isOk: false,
      status: 503,
      error: 'internal_error',
    }));
    const { sync, batch, retries } = await syncWith({ api });

    await sync.push(batch);
    await sync.push(batch);

    expect(retries.map(({ isCancelled }) => isCancelled)).toEqual([true, false]);
  });

  it('names a blocked org and a reader apart, and tries neither again on its own', async () => {
    const blocked = fakeApi(() => ({ isOk: false, status: 402, error: 'org_blocked' }));
    const reader = fakeApi(() => ({ isOk: false, status: 403, error: 'forbidden' }));
    const first = await syncWith({ api: blocked.api });
    const second = await syncWith({ api: reader.api });

    expect(await first.sync.push(first.batch)).toMatchObject({ state: 'blocked' });
    expect(await second.sync.push(second.batch)).toMatchObject({ state: 'read-only' });
    expect([...first.retries, ...second.retries]).toEqual([]);
  });

  it('never reads a file outside the archive, whatever the batch says', async () => {
    const elsewhere = join(
      await mkdtemp(join(tmpdir(), 'qazinho-elsewhere-')),
      'secret.jpg',
    );
    const { api, sent } = fakeApi();
    const { sync, batch, uploaded } = await syncWith({
      api,
      videoOf: () => () => Promise.resolve(elsewhere),
    });

    await writeFile(elsewhere, 'not evidence');
    await sync.push({
      ...batch,
      runs: batch.runs.map((run) => ({
        ...run,
        cases: run.cases.map((runCase) => ({
          ...runCase,
          steps: runCase.steps.map((step) => ({ ...step, shotFile: elsewhere })),
        })),
      })),
      bugs: [],
    });

    expect(uploaded).toEqual([]);
    expect(sent.find(({ method }) => method === 'syncRun')?.body).toMatchObject({
      video: null,
      cases: [{ steps: [{ shot: null }] }],
    });
  });

  it('waits when a screen does not go up, and sends the run once it does', async () => {
    const { api, methods } = fakeApi();
    const { sync, batch, upload } = await syncWith({ api });

    upload.isTaken = false;

    expect(await sync.push(batch)).toMatchObject({ state: 'waiting' });
    expect(methods()).not.toContain('syncRun');

    upload.isTaken = true;

    expect(await sync.push(batch)).toMatchObject({ state: 'synced' });
    expect(methods()).toContain('syncRun');
  });

  it('sends everything again once this computer sends to another org', async () => {
    const { api, sent } = fakeApi();
    const { sync, batch, target } = await syncWith({ api });

    await sync.push(batch);
    target.orgSlug = 'outra';
    await sync.push(batch);

    expect(
      sent.filter(({ method }) => method === 'syncProject').map(({ org }) => org),
    ).toEqual(['loja', 'outra']);
    expect(sent.filter(({ method }) => method === 'syncRun')).toHaveLength(2);
    expect(await sync.shares()).toMatchObject([{ projectId: 'p1', orgSlug: 'outra' }]);
  });

  it('sends a run again once its video is made, with the video this time', async () => {
    let video: string | null = null;
    const { api, sent } = fakeApi();
    const { sync, batch } = await syncWith({
      api,
      videoOf: () => () => Promise.resolve(video),
    });

    await sync.push(batch);
    video = join(batch.runs[0]?.cases[0]?.steps[0]?.shotFile ?? '', '..', 'run.mp4');
    await sync.push(batch);

    expect(
      sent
        .filter(({ method }) => method === 'syncRun')
        .map(({ body }) => (body as { video: unknown }).video),
    ).toEqual([null, 'ev/2']);
  });

  it('does NOT keep what a push sent to an org this computer stopped sending to midway', async () => {
    let target: { orgSlug: string } = { orgSlug: 'loja' };
    const { api } = fakeApi((call) => {
      if (call.method === 'syncRecordings') target = { orgSlug: 'outra' };

      return null;
    });
    const { sync, batch, root } = await syncWith({ api });
    const moving = new ProSync({
      api,
      target: () => Promise.resolve({ token: 'qzm_secret', orgSlug: target.orgSlug }),
      machineName: 'MacBook-Ana',
      file: join(root, 'pro', 'sync.json'),
      archiveRoot: root,
      videoOf: () => Promise.resolve(null),
      variablesOf: () => Promise.resolve([]),
      upload: () => Promise.resolve(true),
      now: () => new Date(),
      schedule: () => () => undefined,
      onShare: () => undefined,
    });

    await moving.push(batch);

    expect(await sync.shares()).toEqual([]);
  });

  it('sends one push at a time for a project, so two at once send it once', async () => {
    const { api, methods } = fakeApi();
    const { sync, batch } = await syncWith({ api });

    await Promise.all([sync.push(batch), sync.push(batch)]);

    expect(methods().filter((method) => method === 'syncProject')).toHaveLength(1);
  });

  it('remembers where each project stands across a restart', async () => {
    const { api } = fakeApi();
    const { sync, batch, root } = await syncWith({ api });

    await sync.push(batch);

    const again = new ProSync({
      api,
      target: () => Promise.resolve({ token: 'qzm_secret', orgSlug: 'loja' }),
      machineName: 'MacBook-Ana',
      file: join(root, 'pro', 'sync.json'),
      archiveRoot: root,
      videoOf: () => Promise.resolve(null),
      variablesOf: () => Promise.resolve([]),
      upload: () => Promise.resolve(true),
      now: () => new Date(),
      schedule: () => () => undefined,
      onShare: () => undefined,
    });

    expect(await again.shares()).toEqual([
      {
        projectId: 'p1',
        orgSlug: 'loja',
        state: 'synced',
        syncedAt: '2026-10-24T12:00:00.000Z',
        conflicts: [],
      },
    ]);
  });

  it('forgets a project whose record no longer reads, and keeps the others', async () => {
    const { api } = fakeApi();
    const { sync, root, batch } = await syncWith({ api });

    await sync.push(batch);

    const file = join(root, 'pro', 'sync.json');
    const kept = JSON.parse(await readFile(file, 'utf8')) as {
      shares: Record<string, unknown>;
    };

    await writeFile(
      file,
      JSON.stringify({
        shares: { ...kept.shares, p2: { orgSlug: 'loja', conflicts: ['w1'] } },
      }),
    );

    expect((await sync.shares()).map(({ projectId }) => projectId)).toEqual(['p1']);
  });
});
