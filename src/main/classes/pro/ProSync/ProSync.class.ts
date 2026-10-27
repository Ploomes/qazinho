import type { IProSync, IProSyncRecord, ProUploader } from './types';
import type {
  IProShare,
  IProSyncBatch,
  IProSyncCase,
  IProSyncRun,
  ProSyncState,
} from '@/shared/types';
import { mkdir, readFile, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { ARCHIVE } from '@/main/classes/storage/Archive/constants';
import { isInside } from '@/main/classes/storage/Archive/library';
import { writeAtomically } from '@/main/library';
import { PLAN_CONFLICT_SCHEMA, PRO_SYNC, SYNC_RECORD_SCHEMA } from './constants';
import {
  bugBodyOf,
  bugFilesOf,
  evidenceKindOf,
  fileFactsOf,
  hashOf,
  movedPlansOf,
  planBodyOf,
  projectBodyOf,
  recordingsBodyOf,
  runBodyOf,
  runFilesOf,
  stateOfRefusal,
} from './library';

/**
 * Sends every project of this computer to its org in the background, what changed since
 * the last time.
 */
export class ProSync {
  private readonly api: IProSync['api'];
  private readonly target: IProSync['target'];
  private readonly machineName: string;
  private readonly file: string;
  private readonly archiveRoot: string;
  private readonly videoOf: IProSync['videoOf'];
  private readonly isVideoRemoved: IProSync['isVideoRemoved'];
  private readonly variablesOf: IProSync['variablesOf'];
  private readonly upload: ProUploader;
  private readonly now: () => Date;
  private readonly schedule: IProSync['schedule'];
  private readonly onShare: (share: IProShare) => void;
  private readonly turns = new Map<string, Promise<IProShare>>();
  private readonly retries = new Map<string, () => void>();

  public constructor(props: IProSync) {
    this.api = props.api;
    this.target = props.target;
    this.machineName = props.machineName;
    this.file = props.file;
    this.archiveRoot = props.archiveRoot;
    this.videoOf = props.videoOf;
    this.isVideoRemoved = props.isVideoRemoved;
    this.variablesOf = props.variablesOf;
    this.upload = props.upload;
    this.now = props.now;
    this.schedule = props.schedule;
    this.onShare = props.onShare;
  }

  public async shares(): Promise<IProShare[]> {
    return Object.entries(await this.read()).map(([projectId, record]) =>
      this.shareOf({ projectId, record }),
    );
  }

  /**
   * Sends what changed in a project, one push at a time per project; everything goes
   * again to an org it never reached.
   */
  public async push(batch: IProSyncBatch): Promise<IProShare> {
    return this.inTurn({
      projectId: batch.project.projectId,
      run: () => this.send(batch),
    });
  }

  /**
   * Builds a workspace's plan on the version the org moved it to, once the QA merged the
   * two; the merged plan goes out on the next push.
   */
  public async resolve(props: {
    projectId: string;
    workspaceId: string;
    version: number;
  }): Promise<IProShare> {
    return this.inTurn({
      projectId: props.projectId,
      run: () => this.takeVersion(props),
    });
  }

  /**
   * Asks the org for the plans it moved past what this computer sent, and hands each to
   * the page.
   */
  public async pull(): Promise<void> {
    const target = await this.target();
    if (target === null) return;

    const answer = await this.api.syncedProjects({
      token: target.token,
      org: target.orgSlug,
    });
    if (!answer.isOk) return;

    for (const [projectId, record] of Object.entries(await this.read())) {
      const project = answer.value.projects.find((one) => one.desktopId === projectId);
      if (
        record.orgSlug !== target.orgSlug ||
        !project ||
        movedPlansOf({ record, plans: project.plans }).length === 0
      )
        continue;

      await this.inTurn({
        projectId,
        run: () => this.takeMoved({ projectId, plans: project.plans }),
      });
    }
  }

  /** Pulls now, and again every few minutes while the app is open. */
  public startPulling(): void {
    const turn = () => {
      void this.pull()
        .catch(() => undefined)
        .finally(() => {
          this.schedule({ ms: PRO_SYNC.pullMs, run: turn });
        });
    };

    turn();
  }

  /**
   * Keeps a project downloaded from its org as shared with it, each plan at the version
   * it came in.
   */
  public async adopt(props: {
    projectId: string;
    orgSlug: string;
    plans: {
      workspaceId: string;
      planId: string;
      version: number;
      cases: IProSyncCase[];
    }[];
  }): Promise<IProShare> {
    const { projectId, orgSlug, plans } = props;

    return this.inTurn({
      projectId,
      run: async () => {
        const records = await this.read();

        records[projectId] = {
          orgSlug,
          state: 'synced',
          syncedAt: this.now().toISOString(),
          conflicts: [],
          project: null,
          plans: Object.fromEntries(
            plans.map(({ workspaceId, planId, version, cases }) => [
              workspaceId,
              { planId, version, hash: '', cases },
            ]),
          ),
          runs: {},
          bugs: {},
          recordings: {},
          evidence: {},
        };
        await this.write(records);

        return this.announce(this.shareOf({ projectId, record: records[projectId] }));
      },
    });
  }

  private inTurn(props: {
    projectId: string;
    run: () => Promise<IProShare>;
  }): Promise<IProShare> {
    const before = this.turns.get(props.projectId) ?? Promise.resolve(null);
    const turn = before.then(props.run, props.run);

    this.turns.set(props.projectId, turn);

    return turn;
  }

  private async takeMoved(props: {
    projectId: string;
    plans: Parameters<typeof movedPlansOf>[0]['plans'];
  }): Promise<IProShare> {
    const { projectId, plans } = props;
    const records = await this.read();
    const record = records[projectId];
    const moved = record === undefined ? [] : movedPlansOf({ record, plans });

    if (record === undefined || moved.length === 0)
      return this.shareOf({ projectId, record });

    records[projectId] = {
      ...record,
      state: 'conflict',
      conflicts: [
        ...record.conflicts.filter(
          (one) => !moved.some(({ workspaceId }) => workspaceId === one.workspaceId),
        ),
        ...moved,
      ],
    };
    await this.write(records);

    return this.announce(this.shareOf({ projectId, record: records[projectId] }));
  }

  private async takeVersion(props: {
    projectId: string;
    workspaceId: string;
    version: number;
  }): Promise<IProShare> {
    const { projectId, workspaceId, version } = props;
    const records = await this.read();
    const record = records[projectId];
    const conflict = record?.conflicts.find((one) => one.workspaceId === workspaceId);

    if (record === undefined || conflict?.version !== version)
      return this.shareOf({ projectId, record });

    const conflicts = record.conflicts.filter((one) => one !== conflict);

    records[projectId] = {
      ...record,
      state: conflicts.length > 0 ? 'conflict' : 'sending',
      conflicts,
      plans: {
        ...record.plans,
        [workspaceId]: {
          planId: record.plans[workspaceId]?.planId ?? null,
          version,
          hash: '',
          cases: conflict.cases,
        },
      },
    };
    await this.write(records);

    return this.announce(this.shareOf({ projectId, record: records[projectId] }));
  }

  private async send(batch: IProSyncBatch): Promise<IProShare> {
    const projectId = batch.project.projectId;
    const target = await this.target();

    if (target === null)
      return { projectId, orgSlug: null, state: 'off', syncedAt: null, conflicts: [] };

    const kept = (await this.read())[projectId];
    const record: IProSyncRecord =
      kept?.orgSlug === target.orgSlug
        ? kept
        : {
            orgSlug: target.orgSlug,
            state: 'sending',
            syncedAt: null,
            conflicts: [],
            project: null,
            plans: {},
            runs: {},
            bugs: {},
            recordings: {},
            evidence: {},
          };

    this.retries.get(projectId)?.();
    this.retries.delete(projectId);
    this.announce({ ...this.shareOf({ projectId, record }), state: 'sending' });

    const refused = await this.sendAll({ batch, record, token: target.token });

    if (refused !== null) {
      if (refused === 'waiting')
        this.retries.set(
          projectId,
          this.schedule({
            ms: PRO_SYNC.retryMs,
            run: () => {
              void this.push(batch);
            },
          }),
        );

      return this.settle({ projectId, record, state: refused });
    }

    return this.settle({
      projectId,
      record: { ...record, syncedAt: this.now().toISOString() },
      state: record.conflicts.length > 0 ? 'conflict' : 'synced',
    });
  }

  private async sendAll(props: {
    batch: IProSyncBatch;
    record: IProSyncRecord;
    token: string;
  }): Promise<ProSyncState | null> {
    return (
      (await this.sendProject(props)) ??
      (await this.sendPlans(props)) ??
      (await this.sendRuns(props)) ??
      (await this.sendBugs(props)) ??
      (await this.sendRecordings(props))
    );
  }

  private async sendProject(props: {
    batch: IProSyncBatch;
    record: IProSyncRecord;
    token: string;
  }): Promise<ProSyncState | null> {
    const { batch, record, token } = props;
    const body = projectBodyOf({
      project: batch.project,
      variables: await this.variablesOf(batch.project.projectId),
    });
    const hash = hashOf(body);

    if (hash === record.project) return null;

    const answer = await this.api.syncProject({
      token,
      org: record.orgSlug,
      path: `projects/${encodeURIComponent(batch.project.projectId)}`,
      body,
    });

    if (!answer.isOk) return stateOfRefusal(answer);

    record.project = hash;

    return null;
  }

  private async sendPlans(props: {
    batch: IProSyncBatch;
    record: IProSyncRecord;
    token: string;
  }): Promise<ProSyncState | null> {
    const { batch, record, token } = props;

    for (const plan of batch.plans) {
      const body = planBodyOf(plan);
      const hash = hashOf(body);
      const kept = record.plans[plan.workspaceId];
      const isWaitingOnQa = record.conflicts.some(
        ({ workspaceId }) => workspaceId === plan.workspaceId,
      );

      if (kept?.hash === hash || isWaitingOnQa) continue;

      const answer = await this.api.syncPlan({
        token,
        org: record.orgSlug,
        path: `projects/${encodeURIComponent(batch.project.projectId)}/plans/${encodeURIComponent(plan.workspaceId)}`,
        body: { ...body, baseVersion: kept?.version ?? null, machine: this.machineName },
      });

      if (!answer.isOk && answer.error === 'plan_conflict') {
        const moved = PLAN_CONFLICT_SCHEMA.safeParse(answer.details);

        if (!moved.success) return 'failed';

        record.conflicts = [
          ...record.conflicts,
          { workspaceId: plan.workspaceId, base: kept?.cases ?? [], ...moved.data },
        ];
        continue;
      }

      if (!answer.isOk) return stateOfRefusal(answer);

      record.plans[plan.workspaceId] = {
        planId: answer.value.plan.id,
        version: answer.value.plan.version,
        hash,
        cases: body.cases,
      };
    }

    return null;
  }

  private async sendRuns(props: {
    batch: IProSyncBatch;
    record: IProSyncRecord;
    token: string;
  }): Promise<ProSyncState | null> {
    const { batch, record, token } = props;

    for (const run of batch.runs) {
      const planId = record.plans[run.workspaceId]?.planId ?? null;
      const key = `${run.workspaceId}/${run.runId}`;
      const videoFile =
        (await this.videoOf({ workspaceId: run.workspaceId, runId: run.runId })) ??
        this.sentVideoOf({ run, record });
      const networkFile = await this.networkOf(run);
      const hash = hashOf({
        run,
        hasVideo:
          videoFile !== null ||
          (await this.isVideoRemoved({ workspaceId: run.workspaceId, runId: run.runId })),
        hasNetwork: networkFile !== null,
      });

      if (planId === null || record.runs[key] === hash) continue;

      const files = [
        ...runFilesOf(run),
        ...(videoFile === null ? [] : [videoFile]),
        ...(networkFile === null ? [] : [networkFile]),
      ];
      const keys = await this.keysOf({ files, record, token });

      if (typeof keys === 'string') return keys;

      const answer = await this.api.syncRun({
        token,
        org: record.orgSlug,
        path: `plans/${encodeURIComponent(planId)}/runs/${encodeURIComponent(run.runId)}`,
        body: runBodyOf({ run, videoFile, networkFile, keys, machine: this.machineName }),
      });

      if (!answer.isOk) return stateOfRefusal(answer);

      record.runs[key] = hash;
    }

    return null;
  }

  private async networkOf(run: IProSyncRun): Promise<string | null> {
    const file = join(this.folderOf(run), ARCHIVE.network);

    return (await stat(file).catch(() => null))?.isFile() === true ? file : null;
  }

  private sentVideoOf(props: {
    run: IProSyncRun;
    record: IProSyncRecord;
  }): string | null {
    const { run, record } = props;

    return (
      Object.values(ARCHIVE.videos)
        .map((name) => join(this.folderOf(run), name))
        .find((file) => record.evidence[file] !== undefined) ?? null
    );
  }

  private folderOf(run: IProSyncRun): string {
    return join(this.archiveRoot, ARCHIVE.runs, run.workspaceId, run.runId);
  }

  private async sendBugs(props: {
    batch: IProSyncBatch;
    record: IProSyncRecord;
    token: string;
  }): Promise<ProSyncState | null> {
    const { batch, record, token } = props;

    for (const bug of batch.bugs) {
      const planId = record.plans[bug.workspaceId]?.planId ?? null;
      const key = `${bug.workspaceId}/${bug.bugId}`;
      const hash = hashOf(bug);

      if (planId === null || record.bugs[key] === hash) continue;

      const keys = await this.keysOf({ files: bugFilesOf(bug), record, token });

      if (typeof keys === 'string') return keys;

      const answer = await this.api.syncBug({
        token,
        org: record.orgSlug,
        path: `plans/${encodeURIComponent(planId)}/bugs/${encodeURIComponent(bug.bugId)}`,
        body: bugBodyOf({ bug, keys }),
      });

      if (!answer.isOk) return stateOfRefusal(answer);

      record.bugs[key] = hash;
    }

    return null;
  }

  private async sendRecordings(props: {
    batch: IProSyncBatch;
    record: IProSyncRecord;
    token: string;
  }): Promise<ProSyncState | null> {
    const { batch, record, token } = props;

    for (const plan of batch.plans) {
      const planId = record.plans[plan.workspaceId]?.planId ?? null;

      if (planId === null) continue;

      const body = recordingsBodyOf({
        text: await this.recipesOf(plan.workspaceId),
        branch: PRO_SYNC.branch,
      });
      const hash = body === null ? null : hashOf(body);

      if (body === null || hash === null || record.recordings[plan.workspaceId] === hash)
        continue;

      const answer = await this.api.syncRecordings({
        token,
        org: record.orgSlug,
        path: `plans/${encodeURIComponent(planId)}/recordings`,
        body,
      });

      if (!answer.isOk) return stateOfRefusal(answer);

      record.recordings[plan.workspaceId] = hash;
    }

    return null;
  }

  private async keysOf(props: {
    files: string[];
    record: IProSyncRecord;
    token: string;
  }): Promise<Record<string, string> | ProSyncState> {
    const { files, record, token } = props;
    const keys: Record<string, string> = {};

    for (const file of files) {
      const known = record.evidence[file];

      if (known !== undefined) {
        keys[file] = known;
        continue;
      }

      const kind = evidenceKindOf(file);

      if (kind === null || !isInside({ root: this.archiveRoot, file })) continue;

      const facts = await fileFactsOf(file);

      if (facts === null) continue;

      const answer = await this.api.evidenceUpload({
        token,
        org: record.orgSlug,
        path: 'evidence',
        body: { ...kind, size: facts.size, sha256: facts.sha256 },
      });

      if (!answer.isOk) return stateOfRefusal(answer);

      const isUploaded = await this.upload({
        url: answer.value.uploadUrl,
        headers: answer.value.headers,
        file,
      });

      if (!isUploaded) return 'waiting';

      record.evidence[file] = answer.value.key;
      keys[file] = answer.value.key;
    }

    return keys;
  }

  private async recipesOf(workspaceId: string): Promise<string | null> {
    const file = join(this.archiveRoot, ARCHIVE.workspaces, workspaceId, ARCHIVE.recipes);

    if (!isInside({ root: this.archiveRoot, file })) return null;

    return readFile(file, 'utf8').catch(() => null);
  }

  private async settle(props: {
    projectId: string;
    record: IProSyncRecord;
    state: ProSyncState;
  }): Promise<IProShare> {
    const { projectId, record, state } = props;
    const records = await this.read();

    if ((await this.target())?.orgSlug !== record.orgSlug)
      return this.shareOf({ projectId, record: records[projectId] });

    records[projectId] = { ...record, state };
    await this.write(records);

    return this.announce(this.shareOf({ projectId, record: records[projectId] }));
  }

  private shareOf(props: {
    projectId: string;
    record: IProSyncRecord | undefined;
  }): IProShare {
    const { projectId, record } = props;

    return record === undefined
      ? { projectId, orgSlug: null, state: 'off', syncedAt: null, conflicts: [] }
      : {
          projectId,
          orgSlug: record.orgSlug,
          state: record.state,
          syncedAt: record.syncedAt,
          conflicts: record.conflicts,
        };
  }

  private announce(share: IProShare): IProShare {
    this.onShare(share);

    return share;
  }

  private async read(): Promise<Record<string, IProSyncRecord>> {
    try {
      const read = JSON.parse(await readFile(this.file, 'utf8')) as {
        shares?: Record<string, unknown>;
      };

      return Object.fromEntries(
        Object.entries(read.shares ?? {}).flatMap(([projectId, kept]) => {
          const record = SYNC_RECORD_SCHEMA.safeParse(kept);

          return record.success ? [[projectId, record.data]] : [];
        }),
      );
    } catch {
      return {};
    }
  }

  private async write(shares: Record<string, IProSyncRecord>): Promise<void> {
    await mkdir(dirname(this.file), { recursive: true });
    await writeAtomically({ file: this.file, data: JSON.stringify({ shares }, null, 2) });
  }
}
