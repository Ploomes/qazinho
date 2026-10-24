import type { ProAnswer } from '@/main/classes/pro/ProApi';
import type { IProSync } from '@/main/classes/pro/ProSync';
import type { IProShare, IProSyncBatch } from '@/shared/types';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
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

type Refusal = { isOk: false; status: number; error: string };

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
  token?: string | null;
  videoOf?: (root: string) => IProSync['videoOf'];
}) {
  const root = await mkdtemp(join(tmpdir(), 'qazinho-sync-'));
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
    token: () => Promise.resolve(props.token === undefined ? 'qzm_secret' : props.token),
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

  return { sync, root, uploaded, upload, retries, shares, batch: batchOf(root) };
}

describe('ProSync', () => {
  it('leaves a project alone until it is shared', async () => {
    const { api, sent } = fakeApi();
    const { sync, batch } = await syncWith({ api });

    expect(await sync.push(batch)).toMatchObject({ projectId: 'p1', state: 'off' });
    expect(sent).toEqual([]);
  });

  it('sends a project shared for the first time whole, its screens before what names them', async () => {
    const { api, sent, methods } = fakeApi();
    const { sync, batch, root, uploaded, shares } = await syncWith({ api });

    expect(await sync.share({ projectId: 'p1', orgSlug: 'loja' })).toMatchObject({
      orgSlug: 'loja',
      state: 'waiting',
    });

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
    expect(shares.map(({ state }) => state)).toEqual(['waiting', 'sending', 'synced']);
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

    await sync.share({ projectId: 'p1', orgSlug: 'loja' });
    await sync.push(batch);
    const before = methods().length;

    expect(await sync.push(batch)).toMatchObject({ state: 'synced' });
    expect(methods()).toHaveLength(before);
    expect(uploaded).toHaveLength(2);
  });

  it('sends only what changed, from the version the org last took', async () => {
    const { api, sent, methods } = fakeApi();
    const { sync, batch } = await syncWith({ api });

    await sync.share({ projectId: 'p1', orgSlug: 'loja' });
    await sync.push(batch);
    const before = methods().length;

    await sync.push({
      ...batch,
      plans: batch.plans.map((plan) => ({ ...plan, name: 'Checkout com Pix e cartão' })),
    });

    expect(methods().slice(before)).toEqual(['syncPlan']);
    expect(sent.at(-1)?.body).toMatchObject({ baseVersion: 1 });
  });

  it('keeps a plan the org moved since as a conflict, and still sends the rest', async () => {
    let isMoved = false;
    const { api, methods } = fakeApi((sent) =>
      isMoved && sent.method === 'syncPlan'
        ? { isOk: false, status: 409, error: 'plan_conflict' }
        : null,
    );
    const { sync, batch } = await syncWith({ api });

    await sync.share({ projectId: 'p1', orgSlug: 'loja' });
    await sync.push(batch);
    isMoved = true;
    const before = methods().length;

    const pushed = await sync.push({
      ...batch,
      plans: batch.plans.map((plan) => ({ ...plan, name: 'Checkout novo' })),
      runs: batch.runs.map((run) => ({ ...run, runId: 'r2' })),
    });

    expect(pushed).toMatchObject({ state: 'conflict', conflicts: ['w1'] });
    expect(methods().slice(before)).toEqual(['syncPlan', 'syncRun']);

    isMoved = false;

    expect(
      await sync.push({
        ...batch,
        plans: batch.plans.map((plan) => ({ ...plan, name: 'Checkout novo' })),
      }),
    ).toMatchObject({ state: 'synced', conflicts: [] });
  });

  it('waits for the network, and tries again on its own a minute later', async () => {
    let isDown = true;
    const { api } = fakeApi(() =>
      isDown ? { isOk: false, status: 0, error: 'unreachable' } : null,
    );
    const { sync, batch, retries, shares } = await syncWith({ api });

    await sync.share({ projectId: 'p1', orgSlug: 'loja' });

    expect(await sync.push(batch)).toMatchObject({ state: 'waiting', syncedAt: null });
    expect(retries).toMatchObject([{ ms: 60_000, isCancelled: false }]);

    isDown = false;
    retries[0]?.run();

    await vi.waitFor(() => {
      expect(shares.at(-1)).toMatchObject({ state: 'synced' });
    });
  });

  it('drops a waiting retry once the project is pushed again, or no longer shared', async () => {
    const { api } = fakeApi(() => ({
      isOk: false,
      status: 503,
      error: 'internal_error',
    }));
    const { sync, batch, retries } = await syncWith({ api });

    await sync.share({ projectId: 'p1', orgSlug: 'loja' });
    await sync.push(batch);
    await sync.push(batch);

    expect(retries.map(({ isCancelled }) => isCancelled)).toEqual([true, false]);

    await sync.share({ projectId: 'p1', orgSlug: null });

    expect(retries.map(({ isCancelled }) => isCancelled)).toEqual([true, true]);
  });

  it('says the machine is signed out, and sends nothing, when it has no token', async () => {
    const { api, sent } = fakeApi();
    const { sync, batch } = await syncWith({ api, token: null });

    await sync.share({ projectId: 'p1', orgSlug: 'loja' });

    expect(await sync.push(batch)).toMatchObject({ state: 'signed-out' });
    expect(sent).toEqual([]);
  });

  it('names a blocked org and a reader apart, and tries neither again on its own', async () => {
    const blocked = fakeApi(() => ({ isOk: false, status: 402, error: 'org_blocked' }));
    const reader = fakeApi(() => ({ isOk: false, status: 403, error: 'forbidden' }));
    const first = await syncWith({ api: blocked.api });
    const second = await syncWith({ api: reader.api });

    await first.sync.share({ projectId: 'p1', orgSlug: 'loja' });
    await second.sync.share({ projectId: 'p1', orgSlug: 'loja' });

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
    await sync.share({ projectId: 'p1', orgSlug: 'loja' });
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

    await sync.share({ projectId: 'p1', orgSlug: 'loja' });
    upload.isTaken = false;

    expect(await sync.push(batch)).toMatchObject({ state: 'waiting' });
    expect(methods()).not.toContain('syncRun');

    upload.isTaken = true;

    expect(await sync.push(batch)).toMatchObject({ state: 'synced' });
    expect(methods()).toContain('syncRun');
  });

  it('sends everything again to a new org, and forgets the project once it stops sharing', async () => {
    const { api, sent } = fakeApi();
    const { sync, batch } = await syncWith({ api });

    await sync.share({ projectId: 'p1', orgSlug: 'loja' });
    await sync.push(batch);
    await sync.share({ projectId: 'p1', orgSlug: 'outra' });
    await sync.push(batch);

    expect(
      sent.filter(({ method }) => method === 'syncProject').map(({ org }) => org),
    ).toEqual(['loja', 'outra']);

    expect(await sync.share({ projectId: 'p1', orgSlug: null })).toMatchObject({
      orgSlug: null,
      state: 'off',
    });
    expect(await sync.shares()).toEqual([]);
  });

  it('sends a run again once its video is made, with the video this time', async () => {
    let video: string | null = null;
    const { api, sent } = fakeApi();
    const { sync, batch } = await syncWith({
      api,
      videoOf: () => () => Promise.resolve(video),
    });

    await sync.share({ projectId: 'p1', orgSlug: 'loja' });
    await sync.push(batch);
    video = join(batch.runs[0]?.cases[0]?.steps[0]?.shotFile ?? '', '..', 'run.mp4');
    await sync.push(batch);

    expect(
      sent
        .filter(({ method }) => method === 'syncRun')
        .map(({ body }) => (body as { video: unknown }).video),
    ).toEqual([null, 'ev/2']);
  });

  it('sends one push at a time for a project, so two at once send it once', async () => {
    const { api, methods } = fakeApi();
    const { sync, batch } = await syncWith({ api });

    await sync.share({ projectId: 'p1', orgSlug: 'loja' });
    await Promise.all([sync.push(batch), sync.push(batch)]);

    expect(methods().filter((method) => method === 'syncProject')).toHaveLength(1);
  });

  it('remembers where each project stands across a restart', async () => {
    const { api } = fakeApi();
    const { sync, batch, root } = await syncWith({ api });

    await sync.share({ projectId: 'p1', orgSlug: 'loja' });
    await sync.push(batch);

    const again = new ProSync({
      api,
      token: () => Promise.resolve('qzm_secret'),
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
});
