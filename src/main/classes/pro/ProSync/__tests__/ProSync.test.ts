import type { ProAnswer } from '@/main/classes/pro/ProApi';
import type { IProSync } from '@/main/classes/pro/ProSync';
import type { IMemory, IProShare, IProSyncBatch } from '@/shared/types';
import { writeFileSync } from 'node:fs';
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

/** O plano da org como outro QA o deixou: versão 4, do Bruno. */
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

/**
 * A plataforma como a sincronização a chama: toda chamada é guardada, e respondida como
 * `refuse` diz ou como a plataforma faria.
 */
function fakeApi(refuse: (sent: ISent) => Refusal | null = () => null) {
  const sent: ISent[] = [];
  const org: {
    plans: { id: string; desktopId: string; version: number }[];
    hasProject: boolean;
    memories: IMemory[];
  } = { plans: [], hasProject: true, memories: [] };
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
    syncMemories: ({ org: slug, path, body }) =>
      answer({
        call: { method: 'syncMemories', org: slug, path, body },
        value: {
          memories: [...org.memories, ...(body as { memories: IMemory[] }).memories],
        },
      }),
    syncedProjects: ({ org: slug }) =>
      answer({
        call: { method: 'syncedProjects', org: slug, path: 'projects', body: null },
        value: {
          projects: (org.hasProject ? ['p1'] : []).map(() => ({
            id: 'project-org',
            desktopId: 'p1',
            key: 'LOJA',
            name: 'Loja',
            targets: [],
            repositories: [],
            variables: [],
            memories: org.memories,
            plans: org.plans.map((plan) => ({
              ...plan,
              name: 'Checkout com Pix',
              targetId: 't1',
              targetKind: 'web' as const,
              issue: null,
              design: null,
              cases: MOVED.cases,
              editedBy: MOVED.editedBy,
              editedAt: MOVED.editedAt,
            })),
          })),
        },
      }),
    deleteProject: ({ org, projectId }) =>
      answer({
        call: { method: 'deleteProject', org, path: `projects/${projectId}`, body: null },
        value: null,
      }),
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

  return { api, sent, org, methods: () => sent.map(({ method }) => method) };
}

/**
 * Um projeto compartilhado com um plano, uma run que deixou uma tela e um vídeo, e o bug
 * que ela achou.
 */
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
                span: null,
              },
            ],
          },
        ],
        videoStartedAt: null,
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
        caught: null,
        sightings: [],
        firstSeenAt: '2026-10-24T10:00:30.000Z',
      },
    ],
    memories: [],
  };
}

async function syncWith(props: {
  api: IProSync['api'];
  isSignedIn?: boolean;
  videoOf?: (root: string) => IProSync['videoOf'];
  isVideoRemoved?: IProSync['isVideoRemoved'];
}) {
  const root = await mkdtemp(join(tmpdir(), 'qazinho-sync-'));
  const account = { isSignedIn: props.isSignedIn ?? true };
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
    token: () => Promise.resolve(account.isSignedIn ? 'qzm_secret' : null),
    machineName: 'MacBook-Ana',
    file: join(root, 'pro', 'sync.json'),
    archiveRoot: root,
    videoOf:
      props.videoOf?.(root) ??
      (({ runId }) =>
        Promise.resolve(
          runId === 'r1' ? join(root, 'runs', 'w1', 'r1', 'run.mp4') : null,
        )),
    isVideoRemoved: props.isVideoRemoved ?? (() => Promise.resolve(false)),
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
  const batch = batchOf(root);

  /** Publica o batch na org `loja`, com a mídia do histórico dele. */
  const publish = (props?: { batch?: IProSyncBatch; hasHistoryMedia?: boolean }) =>
    sync.publish({
      batch: props?.batch ?? batch,
      orgSlug: 'loja',
      hasHistoryMedia: props?.hasHistoryMedia ?? true,
    });

  return { sync, root, account, uploaded, upload, retries, shares, batch, publish };
}

/** O batch com o plano renomeado, uma edição que o QA ainda não mandou. */
function renamed(batch: IProSyncBatch, name = 'Checkout com Pix e cartão') {
  return { ...batch, plans: batch.plans.map((plan) => ({ ...plan, name })) };
}

describe('ProSync', () => {
  // Uma org sem espaço, ou um vídeo grande demais, não pode travar o resto: as runs e os
  // bugs continuam chegando, só sem aquele arquivo.
  it('goes on without a file the org has no room for, and still sends the runs and bugs', async () => {
    const { api, methods } = fakeApi((call) =>
      call.method === 'evidenceUpload'
        ? { isOk: false, status: 409, error: 'evidence_full' }
        : null,
    );
    const { uploaded, publish } = await syncWith({ api });

    const published = await publish();

    expect(published).toMatchObject({ state: 'synced' });
    expect(uploaded).toEqual([]);
    expect(methods()).toEqual(
      expect.arrayContaining(['syncRun', 'syncBug', 'syncRecordings']),
    );
  });

  it('sends nothing on its own: a project never published stays here, signed in or not', async () => {
    const { api, sent } = fakeApi();
    const signedIn = await syncWith({ api });
    const signedOut = await syncWith({ api, isSignedIn: false });

    expect(await signedIn.sync.push(signedIn.batch)).toMatchObject({ state: 'off' });
    expect(await signedOut.sync.push(signedOut.batch)).toMatchObject({ state: 'off' });
    expect(await signedIn.sync.sendPlans(signedIn.batch)).toMatchObject({ state: 'off' });
    expect(sent).toEqual([]);
    expect(await signedIn.sync.shares()).toEqual([]);
  });

  it('publishes a project whole to the org chosen, its plans with it, its screens before what names them', async () => {
    const { api, sent, methods } = fakeApi();
    const { batch, root, uploaded, shares, publish } = await syncWith({ api });

    const published = await publish();

    expect(methods()).toEqual([
      'syncProject',
      'syncPlan',
      'evidenceUpload',
      'evidenceUpload',
      'syncRun',
      'syncBug',
      'syncRecordings',
    ]);
    expect(published).toEqual({
      projectId: 'p1',
      orgSlug: 'loja',
      state: 'synced',
      syncedAt: '2026-10-24T12:00:00.000Z',
      pending: [],
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
      body: {
        variables: [{ name: 'LOGIN_PASSWORD', description: 'senha do QA' }],
        canCreate: true,
      },
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
    expect(batch.plans).toHaveLength(1);
  });

  it('does NOT publish a project linked to another org, which only an unlink lets go', async () => {
    const { api, methods } = fakeApi();
    const { sync, batch, publish } = await syncWith({ api });

    await publish();
    const before = methods().length;

    expect(
      await sync.publish({ batch, orgSlug: 'outra', hasHistoryMedia: true }),
    ).toMatchObject({ orgSlug: 'loja' });
    expect(methods()).toHaveLength(before);
  });

  it('sends nothing the org already has', async () => {
    const { api, methods } = fakeApi();
    const { sync, batch, uploaded, publish } = await syncWith({ api });

    await publish();
    const before = methods().length;

    expect(await sync.push(batch)).toMatchObject({ state: 'synced', pending: [] });
    expect(await sync.sendPlans(batch)).toMatchObject({ state: 'synced', pending: [] });
    expect(methods()).toHaveLength(before);
    expect(uploaded).toHaveLength(2);
  });

  it('keeps a plan edited here until the QA sends it, then sends it from the version the org last took', async () => {
    const { api, sent, methods } = fakeApi();
    const { sync, batch, publish } = await syncWith({ api });

    await publish();
    const before = methods().length;

    expect(await sync.push(renamed(batch))).toMatchObject({ pending: ['w1'] });
    expect(methods()).toHaveLength(before);

    expect(await sync.sendPlans(renamed(batch))).toMatchObject({ pending: [] });
    expect(methods().slice(before)).toEqual(['syncPlan']);
    expect(sent.at(-1)?.body).toMatchObject({ baseVersion: 1 });
  });

  it('sends a run as it happens, while the plan edited beside it waits', async () => {
    const { api, methods } = fakeApi();
    const { sync, batch, publish } = await syncWith({ api });

    await publish();
    const before = methods().length;

    const pushed = await sync.push({
      ...renamed(batch),
      runs: batch.runs.map((run) => ({ ...run, runId: 'r2' })),
    });

    expect(methods().slice(before)).toEqual(['syncRun']);
    expect(pushed).toMatchObject({ state: 'synced', pending: ['w1'] });
  });

  it('never brings back with a later write a project the org deleted, and tells it gone', async () => {
    let isDeleted = false;
    const { api, sent, methods } = fakeApi((call) =>
      isDeleted && call.method === 'syncProject'
        ? { isOk: false, status: 404, error: 'project_not_found' }
        : null,
    );
    const { sync, batch, publish } = await syncWith({ api });
    const moved = {
      ...batch,
      project: { ...batch.project, name: 'Loja — produção' },
    };

    await publish();
    isDeleted = true;

    expect(await sync.push(moved)).toMatchObject({ state: 'gone' });
    expect(sent.at(-1)).toMatchObject({
      method: 'syncProject',
      body: { canCreate: false },
    });

    const before = methods().length;

    expect(await sync.push(moved)).toMatchObject({ state: 'gone' });
    expect(methods()).toHaveLength(before);
  });

  it('publishes again a project told gone, as one the org may create', async () => {
    let isDeleted = true;
    const { api, sent } = fakeApi((call) =>
      isDeleted && call.method === 'syncProject' && call.body !== null
        ? (call.body as { canCreate: boolean }).canCreate
          ? null
          : { isOk: false, status: 404, error: 'project_not_found' }
        : null,
    );
    const { sync, batch, publish } = await syncWith({ api });

    await publish();
    await sync.push({ ...batch, project: { ...batch.project, name: 'Outro nome' } });
    isDeleted = false;

    expect(await publish()).toMatchObject({ state: 'synced', orgSlug: 'loja' });
    expect(sent.filter(({ method }) => method === 'syncProject').at(-1)).toMatchObject({
      body: { canCreate: true },
    });
  });

  it('tells apart an org this person no longer reaches from a project it deleted', async () => {
    const { api } = fakeApi((call) =>
      call.method === 'syncRun'
        ? { isOk: false, status: 404, error: 'org_not_found' }
        : null,
    );
    const { publish } = await syncWith({ api });

    expect(await publish()).toMatchObject({ state: 'no-access' });
  });

  it('keeps a plan the org moved since as a conflict, with what both started from, and still sends the rest', async () => {
    let isMoved = false;
    const { api, methods } = fakeApi((sent) =>
      isMoved && sent.method === 'syncPlan'
        ? { isOk: false, status: 409, error: 'plan_conflict', details: MOVED }
        : null,
    );
    const { sync, batch, publish } = await syncWith({ api });

    await publish();
    isMoved = true;
    const before = methods().length;

    const sentPlans = await sync.sendPlans({
      ...renamed(batch, 'Checkout novo'),
      runs: batch.runs.map((run) => ({ ...run, runId: 'r2' })),
    });

    expect(sentPlans).toMatchObject({
      state: 'conflict',
      pending: ['w1'],
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
    const { sync, batch, publish } = await syncWith({ api });

    await publish();
    isMoved = true;

    expect(await sync.sendPlans(renamed(batch, 'Checkout novo'))).toMatchObject({
      state: 'failed',
      conflicts: [],
    });
  });

  it('holds a plan waiting on the QA, and sends it from the org’s version once taken in', async () => {
    let isMoved = false;
    const { api, sent, methods } = fakeApi((call) =>
      isMoved && call.method === 'syncPlan'
        ? { isOk: false, status: 409, error: 'plan_conflict', details: MOVED }
        : null,
    );
    const { sync, batch, publish } = await syncWith({ api });
    const edited = renamed(batch, 'Checkout novo');

    await publish();
    isMoved = true;
    await sync.sendPlans(edited);
    const before = methods().length;

    await sync.sendPlans(renamed(batch, 'Outro'));

    expect(methods().slice(before)).toEqual([]);

    isMoved = false;

    expect(
      await sync.resolve({ projectId: 'p1', workspaceId: 'w1', version: 3 }),
    ).toMatchObject({ state: 'conflict' });
    expect(
      await sync.resolve({ projectId: 'p1', workspaceId: 'w1', version: 4 }),
    ).toMatchObject({ state: 'synced', conflicts: [] });
    expect(await sync.sendPlans(edited)).toMatchObject({
      state: 'synced',
      conflicts: [],
      pending: [],
    });
    expect(sent.at(-1)).toMatchObject({ method: 'syncPlan', body: { baseVersion: 4 } });
  });

  it('tells the page of a plan the org moved since, as a merged pull request does, without sending or taking it', async () => {
    const { api, org, methods } = fakeApi();
    const { sync, batch, shares, publish } = await syncWith({ api });
    await publish();
    org.plans = [{ id: 'plan-org', desktopId: 'w1', version: 3 }];

    await sync.pull();

    expect(shares.at(-1)).toMatchObject({
      projectId: 'p1',
      state: 'conflict',
      conflicts: [
        {
          workspaceId: 'w1',
          base: batch.plans[0]?.cases,
          version: 3,
          cases: MOVED.cases,
          editedBy: 'Bruno',
          editedAt: MOVED.editedAt,
        },
      ],
    });
    expect(methods().at(-1)).toBe('syncedProjects');
  });

  it('counts a plan taken from the org as it came as nothing to send', async () => {
    const { api, org, methods } = fakeApi();
    const { sync, batch, publish } = await syncWith({ api });
    await publish();
    org.plans = [{ id: 'plan-org', desktopId: 'w1', version: 3 }];
    await sync.pull();
    await sync.resolve({ projectId: 'p1', workspaceId: 'w1', version: 3 });
    const taken = {
      ...batch,
      plans: batch.plans.map((plan) => ({ ...plan, cases: MOVED.cases })),
    };
    const before = methods().length;

    expect(await sync.sendPlans(taken)).toMatchObject({ pending: [] });
    expect(methods().slice(before)).not.toContain('syncPlan');
  });

  it('sends a plan joined from the org’s from the version it took', async () => {
    const { api, org, sent } = fakeApi();
    const { sync, batch, publish } = await syncWith({ api });
    await publish();
    org.plans = [{ id: 'plan-org', desktopId: 'w1', version: 3 }];
    await sync.pull();

    await sync.resolve({ projectId: 'p1', workspaceId: 'w1', version: 3 });

    expect(await sync.push(batch)).toMatchObject({ pending: ['w1'] });

    await sync.sendPlans(batch);

    expect(sent.filter(({ method }) => method === 'syncPlan').at(-1)).toMatchObject({
      body: { baseVersion: 3 },
    });
  });

  it('tells a project the org no longer has as gone, and sends nothing of it again', async () => {
    const { api, org, methods } = fakeApi();
    const { sync, batch, shares, publish } = await syncWith({ api });
    await publish();
    org.hasProject = false;

    await sync.pull();

    expect(shares.at(-1)).toMatchObject({ projectId: 'p1', state: 'gone' });

    const before = methods().length;

    await sync.push(renamed(batch));
    await sync.sendPlans(renamed(batch));

    expect(methods()).toHaveLength(before);
  });

  it('asks nothing while signed out, and leaves a plan at the version this computer sent', async () => {
    const { api, org, sent } = fakeApi();
    const { sync, shares, account, publish } = await syncWith({ api });
    await publish();
    org.plans = [{ id: 'plan-org', desktopId: 'w1', version: 1 }];
    const asked = sent.length;
    const announced = shares.length;

    account.isSignedIn = false;
    await sync.pull();
    account.isSignedIn = true;
    await sync.pull();

    expect(sent.filter(({ method }) => method === 'syncedProjects')).toHaveLength(1);
    expect(sent.length).toBe(asked + 1);
    expect(shares).toHaveLength(announced);
  });

  it('asks each org its own projects alone', async () => {
    const { api, sent } = fakeApi();
    const { sync, batch, publish } = await syncWith({ api });
    await publish();
    await sync.publish({
      batch: { ...batch, project: { ...batch.project, projectId: 'p2' } },
      orgSlug: 'outra',
      hasHistoryMedia: true,
    });

    await sync.pull();

    expect(
      sent.filter(({ method }) => method === 'syncedProjects').map(({ org }) => org),
    ).toEqual(['loja', 'outra']);
  });

  it('pulls again every few minutes while the app is open', async () => {
    const { api, methods } = fakeApi();
    const { sync, retries, publish } = await syncWith({ api });
    await publish();

    sync.startPulling();
    await vi.waitFor(() => {
      expect(retries.map(({ ms }) => ms)).toEqual([300_000]);
    });
    retries[0]?.run();
    await vi.waitFor(() => {
      expect(methods().filter((method) => method === 'syncedProjects')).toHaveLength(2);
    });
  });

  it('keeps a project downloaded from its org as linked, each plan at the version it came in', async () => {
    const { api, sent } = fakeApi();
    const { sync, batch, shares } = await syncWith({ api });

    expect(
      await sync.adopt({
        projectId: 'p1',
        orgSlug: 'loja',
        plans: [
          {
            workspaceId: 'w1',
            planId: 'plan-org',
            version: 7,
            cases: batch.plans[0]!.cases,
          },
        ],
      }),
    ).toMatchObject({ orgSlug: 'loja', state: 'synced', pending: [], conflicts: [] });
    expect(shares.at(-1)).toMatchObject({ orgSlug: 'loja', state: 'synced' });

    expect(await sync.push(batch)).toMatchObject({ pending: [] });
    expect(sent.find(({ method }) => method === 'syncProject')).toMatchObject({
      body: { canCreate: false },
    });
    expect(sent.find(({ method }) => method === 'syncRun')?.path).toBe(
      'plans/plan-org/runs/r1',
    );

    await sync.sendPlans(renamed(batch));

    expect(sent.find(({ method }) => method === 'syncPlan')).toMatchObject({
      body: { baseVersion: 7 },
    });
  });

  it('sends two workspaces’ runs and bugs that share an id, each to its own plan', async () => {
    const { api, sent } = fakeApi();
    const { batch, publish } = await syncWith({ api });
    const other = { ...batch.plans[0]!, workspaceId: 'w2' };

    await publish({
      batch: {
        ...batch,
        plans: [...batch.plans, other],
        runs: [
          ...batch.runs,
          ...batch.runs.map((run) => ({ ...run, workspaceId: 'w2' })),
        ],
        bugs: [
          ...batch.bugs,
          ...batch.bugs.map((bug) => ({ ...bug, workspaceId: 'w2' })),
        ],
      },
    });

    expect(sent.filter(({ method }) => method === 'syncRun')).toHaveLength(2);
    expect(sent.filter(({ method }) => method === 'syncBug')).toHaveLength(2);
  });

  it('leaves the media of the history here when the QA says so, and sends the media of the runs after', async () => {
    const { api, sent } = fakeApi();
    const { sync, batch, uploaded, root, publish } = await syncWith({ api });

    await publish({ hasHistoryMedia: false });

    expect(uploaded).toEqual([]);
    expect(sent.find(({ method }) => method === 'syncRun')?.body).toMatchObject({
      video: null,
      cases: [{ steps: [{ shot: null }] }],
    });
    expect(sent.find(({ method }) => method === 'syncBug')?.body).toMatchObject({
      shots: [],
    });

    await sync.push({
      ...batch,
      runs: batch.runs.map((run) => ({
        ...run,
        runId: 'r2',
        startedAt: '2026-10-24T13:00:00.000Z',
      })),
    });

    expect(uploaded).toEqual([join(root, 'runs', 'w1', 'r1', '2.jpg')]);
  });

  it('waits for the network, and tries again on its own a minute later', async () => {
    let isDown = true;
    const { api } = fakeApi(() =>
      isDown ? { isOk: false, status: 0, error: 'unreachable' } : null,
    );
    const { retries, shares, publish } = await syncWith({ api });

    expect(await publish()).toMatchObject({ state: 'waiting', syncedAt: null });
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
    const { sync, batch, retries, publish } = await syncWith({ api });

    await publish();
    await sync.push(batch);

    expect(retries.map(({ isCancelled }) => isCancelled)).toEqual([true, false]);
  });

  it('names a blocked org and a reader apart, and tries neither again on its own', async () => {
    const blocked = fakeApi(() => ({ isOk: false, status: 402, error: 'org_blocked' }));
    const reader = fakeApi(() => ({ isOk: false, status: 403, error: 'forbidden' }));
    const first = await syncWith({ api: blocked.api });
    const second = await syncWith({ api: reader.api });

    expect(await first.publish()).toMatchObject({ state: 'blocked' });
    expect(await second.publish()).toMatchObject({ state: 'read-only' });
    expect([...first.retries, ...second.retries]).toEqual([]);
  });

  it('never reads a file outside the archive, whatever the batch says', async () => {
    const elsewhere = join(
      await mkdtemp(join(tmpdir(), 'qazinho-elsewhere-')),
      'secret.jpg',
    );
    const { api, sent } = fakeApi();
    const { batch, uploaded, publish } = await syncWith({
      api,
      videoOf: () => () => Promise.resolve(elsewhere),
    });

    await writeFile(elsewhere, 'not evidence');
    await publish({
      batch: {
        ...batch,
        runs: batch.runs.map((run) => ({
          ...run,
          cases: run.cases.map((runCase) => ({
            ...runCase,
            steps: runCase.steps.map((step) => ({ ...step, shotFile: elsewhere })),
          })),
        })),
        bugs: [],
        memories: [],
      },
    });

    expect(uploaded).toEqual([]);
    expect(sent.find(({ method }) => method === 'syncRun')?.body).toMatchObject({
      video: null,
      cases: [{ steps: [{ shot: null }] }],
    });
  });

  it('waits when a screen does not go up, and sends the run once it does', async () => {
    const { api, methods } = fakeApi();
    const { sync, batch, upload, publish } = await syncWith({ api });

    upload.isTaken = false;

    expect(await publish()).toMatchObject({ state: 'waiting' });
    expect(methods()).not.toContain('syncRun');

    upload.isTaken = true;

    expect(await sync.push(batch)).toMatchObject({ state: 'synced' });
    expect(methods()).toContain('syncRun');
  });

  it('sends a run again once its video is made, with the video this time', async () => {
    let video: string | null = null;
    const { api, sent } = fakeApi();
    const { sync, batch, publish } = await syncWith({
      api,
      videoOf: () => () => Promise.resolve(video),
    });

    await publish();
    video = join(batch.runs[0]?.cases[0]?.steps[0]?.shotFile ?? '', '..', 'run.mp4');
    await sync.push(batch);

    expect(
      sent
        .filter(({ method }) => method === 'syncRun')
        .map(({ body }) => (body as { video: unknown }).video),
    ).toEqual([null, 'ev/2']);
  });

  it('does NOT send a run again once this computer let its video go, which the org still keeps', async () => {
    let video: string | null = null;
    let isRemoved = false;
    const { api, sent } = fakeApi();
    const { sync, batch, publish } = await syncWith({
      api,
      videoOf: () => () => Promise.resolve(video),
      isVideoRemoved: () => Promise.resolve(isRemoved),
    });
    video = join(batch.runs[0]?.cases[0]?.steps[0]?.shotFile ?? '', '..', 'run.mp4');

    await publish();
    video = null;
    isRemoved = true;
    await sync.push(batch);

    expect(
      sent
        .filter(({ method }) => method === 'syncRun')
        .map(({ body }) => (body as { video: unknown }).video),
    ).toEqual(['ev/2']);
  });

  it('keeps the org’s video on a run sent again after this computer let it go', async () => {
    let video: string | null = null;
    let isRemoved = false;
    const { api, sent } = fakeApi();
    const { sync, batch, publish } = await syncWith({
      api,
      videoOf: () => () => Promise.resolve(video),
      isVideoRemoved: () => Promise.resolve(isRemoved),
    });
    video = join(batch.runs[0]?.cases[0]?.steps[0]?.shotFile ?? '', '..', 'run.mp4');

    await publish();
    video = null;
    isRemoved = true;
    await sync.push({
      ...batch,
      runs: batch.runs.map((run) => ({ ...run, durationSec: 41 })),
    });

    expect(
      sent
        .filter(({ method }) => method === 'syncRun')
        .map(({ body }) => (body as { video: unknown }).video),
    ).toEqual(['ev/2', 'ev/2']);
  });

  it('sends the requests a web run kept beside it, named in the run', async () => {
    const { api, sent } = fakeApi();
    const { root, uploaded, publish } = await syncWith({ api });
    const network = join(root, 'runs', 'w1', 'r1', 'network.json');

    await writeFile(network, '[]');
    await publish();

    expect(uploaded).toContain(network);
    expect(
      sent
        .filter(({ method }) => method === 'evidenceUpload')
        .map(({ body }) => (body as { kind: string }).kind),
    ).toEqual(['screenshot', 'video', 'network']);
    expect(sent.find(({ method }) => method === 'syncRun')?.body).toMatchObject({
      network: 'ev/3',
    });
  });

  it('does NOT keep what a push sent once the project was unlinked midway', async () => {
    const holder: { file: string } = { file: '' };
    const { api } = fakeApi((call) => {
      if (call.method === 'syncRecordings')
        writeFileSync(holder.file, JSON.stringify({ shares: {} }));

      return null;
    });
    const { sync, root, publish } = await syncWith({ api });
    holder.file = join(root, 'pro', 'sync.json');

    await publish();

    expect(await sync.shares()).toEqual([]);
  });

  it('sends one push at a time for a project, so two at once send it once', async () => {
    const { api, methods } = fakeApi();
    const { sync, batch, publish } = await syncWith({ api });

    await Promise.all([publish(), sync.push(batch)]);

    expect(methods().filter((method) => method === 'syncProject')).toHaveLength(1);
  });

  it('unlinks a project: it is no longer sent, and may be published anew', async () => {
    const { api, methods } = fakeApi();
    const { sync, batch, shares, publish } = await syncWith({ api });

    await publish();

    expect(await sync.forget('p1')).toMatchObject({ projectId: 'p1', state: 'off' });
    expect(shares.at(-1)).toMatchObject({ orgSlug: null });
    expect(await sync.shares()).toEqual([]);

    const before = methods().length;

    await sync.push(renamed(batch));

    expect(methods()).toHaveLength(before);
    expect(
      await sync.publish({ batch, orgSlug: 'outra', hasHistoryMedia: true }),
    ).toMatchObject({ orgSlug: 'outra', state: 'synced' });
  });

  it('deletes a project in its org, then unlinks it', async () => {
    const { api, sent } = fakeApi();
    const { sync, publish } = await syncWith({ api });
    await publish();

    expect(await sync.remove('p1')).toEqual({ isRemoved: true });
    expect(sent.at(-1)).toMatchObject({
      method: 'deleteProject',
      org: 'loja',
      path: 'projects/p1',
    });
    expect(await sync.shares()).toEqual([]);
  });

  it('keeps a project linked while the org refuses to delete it, and says why', async () => {
    const { api } = fakeApi((call) =>
      call.method === 'deleteProject'
        ? { isOk: false, status: 409, error: 'project_busy' }
        : null,
    );
    const { sync, account, publish } = await syncWith({ api });
    await publish();

    expect(await sync.remove('p1')).toEqual({ isRemoved: false, failure: 'busy' });

    account.isSignedIn = false;

    expect(await sync.remove('p1')).toEqual({ isRemoved: false, failure: 'signed-out' });
    expect(await sync.shares()).toMatchObject([{ projectId: 'p1', orgSlug: 'loja' }]);
  });

  it('weighs what publishing sends, the media inside the archive alone', async () => {
    const { api, sent } = fakeApi();
    const { sync, batch } = await syncWith({ api });

    expect(await sync.brief(batch)).toEqual({
      plans: 1,
      runs: 1,
      bugs: 1,
      memories: 0,
      mediaBytes: 7,
    });
    expect(
      await sync.brief({
        ...batch,
        bugs: [],
        runs: batch.runs.map((run) => ({
          ...run,
          cases: run.cases.map((runCase) => ({
            ...runCase,
            steps: runCase.steps.map((step) => ({ ...step, shotFile: '/etc/hosts' })),
          })),
        })),
      }),
    ).toMatchObject({ mediaBytes: 3 });
    expect(sent).toEqual([]);
  });

  it('remembers where each project stands across a restart', async () => {
    const { api } = fakeApi();
    const { root, publish } = await syncWith({ api });

    await publish();

    const again = new ProSync({
      api,
      token: () => Promise.resolve('qzm_secret'),
      machineName: 'MacBook-Ana',
      file: join(root, 'pro', 'sync.json'),
      archiveRoot: root,
      videoOf: () => Promise.resolve(null),
      isVideoRemoved: () => Promise.resolve(false),
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
        pending: [],
        conflicts: [],
      },
    ]);
  });

  it('forgets a project whose record no longer reads, and keeps the others', async () => {
    const { api } = fakeApi();
    const { sync, root, publish } = await syncWith({ api });

    await publish();

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

  it('reads a record kept before projects were linked one at a time', async () => {
    const { api } = fakeApi();
    const { sync, root, publish } = await syncWith({ api });

    await publish();

    const file = join(root, 'pro', 'sync.json');
    const kept = JSON.parse(await readFile(file, 'utf8')) as {
      shares: { p1: Record<string, unknown> };
    };
    const { mediaFrom: _mediaFrom, pending: _pending, ...older } = kept.shares.p1;

    await writeFile(file, JSON.stringify({ shares: { p1: older } }));

    expect(await sync.shares()).toMatchObject([{ projectId: 'p1', pending: [] }]);
  });

  describe('what the agent learned', () => {
    const memory = (over: Partial<IMemory> = {}): IMemory => ({
      id: 'm-1',
      text: 'Os formulários ficam em Ajustes.',
      scope: 'project',
      workspaceId: null,
      target: 'all',
      createdAt: '2026-11-01T10:00:00.000Z',
      updatedAt: '2026-11-01T10:00:00.000Z',
      deletedAt: null,
      ...over,
    });

    it('sends it with the project, and tells the page the list as the org has it', async () => {
      const { api, sent, org } = fakeApi();
      const { batch, publish, shares } = await syncWith({ api });

      org.memories = [memory({ id: 'do-colega' })];

      await publish({ batch: { ...batch, memories: [memory()] } });

      expect(sent.find(({ method }) => method === 'syncMemories')?.path).toBe(
        'projects/p1/memories',
      );
      expect(
        shares
          .flatMap((share) => share.memories ?? [])
          .map(({ id }) => id)
          .sort(),
      ).toEqual(['do-colega', 'm-1']);
    });

    it('lets the rest of the project go when the org refuses the memories', async () => {
      const { api } = fakeApi(({ method }) =>
        method === 'syncMemories'
          ? {
              isOk: false,
              status: 409,
              error: 'memory_limit',
              details: { memories: [memory({ id: 'do-colega' })] },
            }
          : null,
      );
      const { batch, publish, shares } = await syncWith({ api });

      await publish({ batch: { ...batch, memories: [memory()] } });

      expect(shares.at(-1)?.state).not.toBe('failed');
      expect(shares.flatMap((share) => share.memories ?? []).map(({ id }) => id)).toEqual(
        ['do-colega'],
      );
    });

    it('stops the project when the session itself is refused', async () => {
      const { api } = fakeApi(({ method }) =>
        method === 'syncMemories'
          ? { isOk: false, status: 402, error: 'org_blocked' }
          : null,
      );
      const { batch, publish, shares } = await syncWith({ api });

      await publish({ batch: { ...batch, memories: [memory()] } });

      expect(shares.at(-1)?.state).toBe('blocked');
    });

    it('does not send it again when nothing changed', async () => {
      const { api, methods } = fakeApi();
      const { sync, batch, publish } = await syncWith({ api });
      const taught = { ...batch, memories: [memory()] };

      await publish({ batch: taught });
      await sync.push(taught);

      expect(methods().filter((method) => method === 'syncMemories')).toHaveLength(1);
    });

    it('hands the page what a teammate taught the org, on a pull', async () => {
      const { api, org } = fakeApi();
      const { sync, publish, shares } = await syncWith({ api });

      await publish();
      org.memories = [memory({ id: 'do-colega' })];
      shares.length = 0;

      await sync.pull();

      expect(shares.at(-1)?.memories?.map(({ id }) => id)).toEqual(['do-colega']);
    });

    it('tells the page nothing on a pull when the org has nothing new', async () => {
      const { api, org } = fakeApi();
      const { sync, publish, shares } = await syncWith({ api });

      await publish();
      org.memories = [memory({ id: 'do-colega' })];
      await sync.pull();
      shares.length = 0;

      await sync.pull();

      expect(shares.flatMap((share) => share.memories ?? [])).toEqual([]);
    });
  });
});
