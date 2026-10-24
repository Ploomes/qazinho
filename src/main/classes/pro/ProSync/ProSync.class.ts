import type { IProSync, IProSyncRecord, ProUploader } from './types';
import type { IProShare, IProSyncBatch, ProSyncState } from '@/shared/types';
import { mkdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { ARCHIVE } from '@/main/classes/storage/Archive/constants';
import { isInside } from '@/main/classes/storage/Archive/library';
import { writeAtomically } from '@/main/library';
import { PRO_SYNC } from './constants';
import {
  bugBodyOf,
  bugFilesOf,
  evidenceKindOf,
  fileFactsOf,
  hashOf,
  planBodyOf,
  projectBodyOf,
  recordingsBodyOf,
  runBodyOf,
  runFilesOf,
  stateOfRefusal,
} from './library';

/** Sends each shared project to its org of QAzinho Pro: what changed since the last time, with its screens and videos, waiting for the network and saying where each one stands. */
export class ProSync {
  private readonly api: IProSync['api'];
  private readonly token: () => Promise<string | null>;
  private readonly machineName: string;
  private readonly file: string;
  private readonly archiveRoot: string;
  private readonly videoOf: IProSync['videoOf'];
  private readonly variablesOf: IProSync['variablesOf'];
  private readonly upload: ProUploader;
  private readonly now: () => Date;
  private readonly schedule: IProSync['schedule'];
  private readonly onShare: (share: IProShare) => void;
  private readonly turns = new Map<string, Promise<IProShare>>();
  private readonly retries = new Map<string, () => void>();

  public constructor(props: IProSync) {
    this.api = props.api;
    this.token = props.token;
    this.machineName = props.machineName;
    this.file = props.file;
    this.archiveRoot = props.archiveRoot;
    this.videoOf = props.videoOf;
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

  /** Shares a project with an org, or stops sharing it with null; a new org gets everything again on the next push. */
  public async share(props: {
    projectId: string;
    orgSlug: string | null;
  }): Promise<IProShare> {
    const { projectId, orgSlug } = props;
    const records = await this.read();
    const kept = records[projectId];

    this.retries.get(projectId)?.();
    this.retries.delete(projectId);

    if (orgSlug === null) {
      Reflect.deleteProperty(records, projectId);
      await this.write(records);

      return this.announce({
        projectId,
        orgSlug: null,
        state: 'off',
        syncedAt: null,
        conflicts: [],
      });
    }

    records[projectId] =
      kept?.orgSlug === orgSlug
        ? kept
        : {
            orgSlug,
            state: 'waiting',
            syncedAt: null,
            conflicts: [],
            project: null,
            plans: {},
            runs: {},
            bugs: {},
            recordings: {},
            evidence: {},
          };
    await this.write(records);

    return this.announce(this.shareOf({ projectId, record: records[projectId] }));
  }

  /** Sends what changed in a shared project, one push at a time per project; a project not shared is left alone. */
  public async push(batch: IProSyncBatch): Promise<IProShare> {
    const projectId = batch.project.projectId;
    const before = this.turns.get(projectId) ?? Promise.resolve(null);
    const turn = before.then(
      () => this.send(batch),
      () => this.send(batch),
    );

    this.turns.set(projectId, turn);

    return turn;
  }

  private async send(batch: IProSyncBatch): Promise<IProShare> {
    const projectId = batch.project.projectId;
    const records = await this.read();
    const record = records[projectId];

    if (record === undefined)
      return { projectId, orgSlug: null, state: 'off', syncedAt: null, conflicts: [] };

    this.retries.get(projectId)?.();
    this.retries.delete(projectId);

    const token = await this.token();

    if (token === null) return this.settle({ projectId, record, state: 'signed-out' });

    this.announce({ ...this.shareOf({ projectId, record }), state: 'sending' });

    const refused = await this.sendAll({ batch, record, token });

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

      if (kept?.hash === hash) continue;

      const answer = await this.api.syncPlan({
        token,
        org: record.orgSlug,
        path: `projects/${encodeURIComponent(batch.project.projectId)}/plans/${encodeURIComponent(plan.workspaceId)}`,
        body: { ...body, baseVersion: kept?.version ?? null, machine: this.machineName },
      });

      if (!answer.isOk && answer.error === 'plan_conflict') {
        record.conflicts = [...new Set([...record.conflicts, plan.workspaceId])];
        continue;
      }

      if (!answer.isOk) return stateOfRefusal(answer);

      record.plans[plan.workspaceId] = {
        planId: answer.value.plan.id,
        version: answer.value.plan.version,
        hash,
      };
      record.conflicts = record.conflicts.filter((id) => id !== plan.workspaceId);
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
      const planId = record.plans[run.workspaceId]?.planId;
      const videoFile = await this.videoOf({
        workspaceId: run.workspaceId,
        runId: run.runId,
      });
      const hash = hashOf({ run, hasVideo: videoFile !== null });

      if (planId === undefined || record.runs[run.runId] === hash) continue;

      const files = [...runFilesOf(run), ...(videoFile === null ? [] : [videoFile])];
      const keys = await this.keysOf({ files, record, token });

      if (typeof keys === 'string') return keys;

      const answer = await this.api.syncRun({
        token,
        org: record.orgSlug,
        path: `plans/${encodeURIComponent(planId)}/runs/${encodeURIComponent(run.runId)}`,
        body: runBodyOf({ run, videoFile, keys, machine: this.machineName }),
      });

      if (!answer.isOk) return stateOfRefusal(answer);

      record.runs[run.runId] = hash;
    }

    return null;
  }

  private async sendBugs(props: {
    batch: IProSyncBatch;
    record: IProSyncRecord;
    token: string;
  }): Promise<ProSyncState | null> {
    const { batch, record, token } = props;

    for (const bug of batch.bugs) {
      const planId = record.plans[bug.workspaceId]?.planId;
      const hash = hashOf(bug);

      if (planId === undefined || record.bugs[bug.bugId] === hash) continue;

      const keys = await this.keysOf({ files: bugFilesOf(bug), record, token });

      if (typeof keys === 'string') return keys;

      const answer = await this.api.syncBug({
        token,
        org: record.orgSlug,
        path: `plans/${encodeURIComponent(planId)}/bugs/${encodeURIComponent(bug.bugId)}`,
        body: bugBodyOf({ bug, keys }),
      });

      if (!answer.isOk) return stateOfRefusal(answer);

      record.bugs[bug.bugId] = hash;
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
      const planId = record.plans[plan.workspaceId]?.planId;

      if (planId === undefined) continue;

      const body = recordingsBodyOf({
        text: await this.recipesOf(plan.workspaceId),
        branch: PRO_SYNC.branch,
      });
      const hash = body === null ? null : hashOf(body);

      if (body === null || record.recordings[plan.workspaceId] === hash) continue;

      const answer = await this.api.syncRecordings({
        token,
        org: record.orgSlug,
        path: `plans/${encodeURIComponent(planId)}/recordings`,
        body,
      });

      if (!answer.isOk) return stateOfRefusal(answer);

      record.recordings[plan.workspaceId] = hash ?? '';
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

    if (records[projectId]?.orgSlug !== record.orgSlug)
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
        shares?: Record<string, IProSyncRecord>;
      };

      return read.shares ?? {};
    } catch {
      return {};
    }
  }

  private async write(shares: Record<string, IProSyncRecord>): Promise<void> {
    await mkdir(dirname(this.file), { recursive: true });
    await writeAtomically({ file: this.file, data: JSON.stringify({ shares }, null, 2) });
  }
}
