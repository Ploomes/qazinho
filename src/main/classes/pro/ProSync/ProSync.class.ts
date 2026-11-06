import type { IProSync, IProSyncRecord, ProUploader } from './types';
import type {
  IProPublishBrief,
  IProShare,
  IProSyncBatch,
  IProSyncCase,
  IProSyncRun,
  ProRemoval,
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
  healedPlansOf,
  movedPlansOf,
  pendingPlansOf,
  planBodyOf,
  projectBodyOf,
  recordingsBodyOf,
  removalOf,
  runBodyOf,
  runFilesOf,
  isSkippedEvidence,
  stateOfRefusal,
} from './library';

/**
 * Mantém cada projeto ligado a uma org em dia com ela: runs e bugs como acontecem, planos
 * quando o QA os manda, e os planos que a org mexeu desde então.
 */
export class ProSync {
  private readonly api: IProSync['api'];
  private readonly token: IProSync['token'];
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
    this.token = props.token;
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
   * Liga um projeto a uma org e o manda inteiro, os planos incluídos; a mídia das runs
   * anteriores fica aqui a menos que o QA mande a do histórico também.
   */
  public async publish(props: {
    batch: IProSyncBatch;
    orgSlug: string;
    hasHistoryMedia: boolean;
  }): Promise<IProShare> {
    const { batch, orgSlug, hasHistoryMedia } = props;
    const projectId = batch.project.projectId;

    return this.inTurn({
      projectId,
      run: async () => {
        const records = await this.read();
        const kept = records[projectId];

        if (kept !== undefined && !this.isUnlinked(kept))
          return this.shareOf({ projectId, record: kept });

        records[projectId] = {
          ...this.freshRecord(orgSlug),
          mediaFrom: hasHistoryMedia ? null : this.now().toISOString(),
        };
        await this.write(records);

        return this.send({ batch, withPlans: true });
      },
    });
  }

  /**
   * Manda o que mudou num projeto ligado menos os planos: o projeto, as runs, bugs e
   * gravações; cada plano editado aqui é dito como esperando para ser enviado.
   */
  public async push(batch: IProSyncBatch): Promise<IProShare> {
    return this.inTurn({
      projectId: batch.project.projectId,
      run: () => this.send({ batch, withPlans: false }),
    });
  }

  /**
   * Manda os planos editados aqui de um projeto ligado, cada um como a próxima versão da
   * org.
   */
  public async sendPlans(batch: IProSyncBatch): Promise<IProShare> {
    return this.inTurn({
      projectId: batch.project.projectId,
      run: () => this.send({ batch, withPlans: true }),
    });
  }

  /**
   * Constrói o plano de um workspace sobre a versão para a qual a org o moveu, depois que
   * o QA o aceitou; o que ele manteve do próprio espera para ser enviado.
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
   * Pergunta a cada org os planos que ela mexeu além do que este computador pegou, e
   * avisa a página sem mudá-los; um projeto que a org não tem mais recebe gone.
   */
  public async pull(): Promise<void> {
    const token = await this.token();
    if (token === null) return;

    const records = await this.read();
    const orgs = [...new Set(Object.values(records).map(({ orgSlug }) => orgSlug))];

    for (const org of orgs) {
      const answer = await this.api.syncedProjects({ token, org });
      if (!answer.isOk) continue;

      for (const [projectId, record] of Object.entries(records)) {
        if (record.orgSlug !== org || this.isUnlinked(record)) continue;

        const project = answer.value.projects.find((one) => one.desktopId === projectId);

        if (project === undefined && record.project !== null) {
          await this.inTurn({
            projectId,
            run: () => this.markGone({ projectId, orgSlug: org }),
          });
          continue;
        }

        if (!project || movedPlansOf({ record, plans: project.plans }).length === 0)
          continue;

        await this.inTurn({
          projectId,
          run: () => this.takeMoved({ projectId, plans: project.plans }),
        });
      }
    }
  }

  /** Busca agora, e de novo a cada poucos minutos enquanto o app está aberto. */
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
   * Mantém um projeto baixado da org dele como ligado a ela, cada plano na versão em que
   * veio.
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
          ...this.freshRecord(orgSlug),
          state: 'synced',
          syncedAt: this.now().toISOString(),
          project: '',
          plans: Object.fromEntries(
            plans.map(({ workspaceId, planId, version, cases }) => [
              workspaceId,
              { planId, version, hash: '', cases },
            ]),
          ),
        };
        await this.write(records);

        return this.announce(this.shareOf({ projectId, record: records[projectId] }));
      },
    });
  }

  /** Desliga um projeto: ele fica aqui, e nada dele vai à org de novo. */
  public async forget(projectId: string): Promise<IProShare> {
    return this.inTurn({
      projectId,
      run: async () => {
        const records = await this.read();

        this.retries.get(projectId)?.();
        this.retries.delete(projectId);
        delete records[projectId];
        await this.write(records);

        return this.announce(this.shareOf({ projectId, record: undefined }));
      },
    });
  }

  /** Apaga um projeto ligado na org dele, depois o desliga; uma recusa mantém os dois. */
  public async remove(projectId: string): Promise<ProRemoval> {
    const token = await this.token();
    const record = (await this.read())[projectId];

    if (record === undefined) return { isRemoved: true };
    if (token === null) return { isRemoved: false, failure: 'signed-out' };

    const removal = removalOf(
      await this.api.deleteProject({ token, org: record.orgSlug, projectId }),
    );

    if (removal.isRemoved) await this.forget(projectId);

    return removal;
  }

  /** O que publicar um projeto manda, e quanto pesa a mídia do histórico dele. */
  public async brief(batch: IProSyncBatch): Promise<IProPublishBrief> {
    const files = new Set<string>();

    for (const run of batch.runs) {
      const video = await this.videoOf({
        workspaceId: run.workspaceId,
        runId: run.runId,
      });
      const network = await this.networkOf(run);

      for (const file of [...runFilesOf(run), video, network])
        if (file !== null) files.add(file);
    }

    for (const bug of batch.bugs) for (const file of bugFilesOf(bug)) files.add(file);

    let mediaBytes = 0;

    for (const file of files) {
      if (!isInside({ root: this.archiveRoot, file })) continue;

      mediaBytes += (await stat(file).catch(() => null))?.size ?? 0;
    }

    return {
      plans: batch.plans.length,
      runs: batch.runs.length,
      bugs: batch.bugs.length,
      mediaBytes,
    };
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

  private freshRecord(orgSlug: string): IProSyncRecord {
    return {
      orgSlug,
      state: 'sending',
      syncedAt: null,
      mediaFrom: null,
      pending: [],
      conflicts: [],
      project: null,
      plans: {},
      runs: {},
      bugs: {},
      recordings: {},
      evidence: {},
    };
  }

  private isUnlinked(record: IProSyncRecord): boolean {
    return record.state === 'gone' || record.state === 'no-access';
  }

  private async markGone(props: {
    projectId: string;
    orgSlug: string;
  }): Promise<IProShare> {
    const { projectId, orgSlug } = props;
    const records = await this.read();
    const record = records[projectId];

    if (record?.orgSlug !== orgSlug) return this.shareOf({ projectId, record });

    records[projectId] = { ...record, state: 'gone' };
    await this.write(records);

    return this.announce(this.shareOf({ projectId, record: records[projectId] }));
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
      state: conflicts.length > 0 ? 'conflict' : 'synced',
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

  private async send(props: {
    batch: IProSyncBatch;
    withPlans: boolean;
  }): Promise<IProShare> {
    const { batch, withPlans } = props;
    const projectId = batch.project.projectId;
    const token = await this.token();
    const kept = (await this.read())[projectId];

    if (token === null || kept === undefined || this.isUnlinked(kept))
      return this.shareOf({ projectId, record: kept });

    const record: IProSyncRecord = {
      ...kept,
      plans: healedPlansOf({ record: kept, plans: batch.plans }),
    };

    this.retries.get(projectId)?.();
    this.retries.delete(projectId);
    this.announce({ ...this.shareOf({ projectId, record }), state: 'sending' });

    const refused = await this.sendAll({ batch, record, token, withPlans });

    record.pending = pendingPlansOf({ record, plans: batch.plans });

    if (refused !== null) {
      if (refused === 'waiting')
        this.retries.set(
          projectId,
          this.schedule({
            ms: PRO_SYNC.retryMs,
            run: () => {
              void this.inTurn({
                projectId,
                run: () => this.send({ batch, withPlans }),
              });
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
    withPlans: boolean;
  }): Promise<ProSyncState | null> {
    return (
      (await this.sendProject(props)) ??
      (props.withPlans ? await this.sendEditedPlans(props) : null) ??
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
      body: { ...body, canCreate: record.project === null },
    });

    if (!answer.isOk) return stateOfRefusal(answer);

    record.project = hash;

    return null;
  }

  private async sendEditedPlans(props: {
    batch: IProSyncBatch;
    record: IProSyncRecord;
    token: string;
  }): Promise<ProSyncState | null> {
    const { batch, record, token } = props;
    const pending = pendingPlansOf({ record, plans: batch.plans });

    for (const plan of batch.plans) {
      const body = planBodyOf(plan);
      const kept = record.plans[plan.workspaceId];
      const isWaitingOnQa = record.conflicts.some(
        ({ workspaceId }) => workspaceId === plan.workspaceId,
      );

      if (!pending.includes(plan.workspaceId) || isWaitingOnQa) continue;

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
        hash: hashOf(body),
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
      const hasMedia = this.hasMediaAt({ record, at: run.startedAt });
      const videoFile = hasMedia
        ? ((await this.videoOf({ workspaceId: run.workspaceId, runId: run.runId })) ??
          this.sentVideoOf({ run, record }))
        : null;
      const networkFile = hasMedia ? await this.networkOf(run) : null;
      const hash = hashOf({
        run,
        hasVideo:
          videoFile !== null ||
          (hasMedia &&
            (await this.isVideoRemoved({
              workspaceId: run.workspaceId,
              runId: run.runId,
            }))),
        hasNetwork: networkFile !== null,
      });

      if (planId === null || record.runs[key] === hash) continue;

      const files = hasMedia
        ? [
            ...runFilesOf(run),
            ...(videoFile === null ? [] : [videoFile]),
            ...(networkFile === null ? [] : [networkFile]),
          ]
        : [];
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

  private hasMediaAt(props: { record: IProSyncRecord; at: string }): boolean {
    return props.record.mediaFrom === null || props.at >= props.record.mediaFrom;
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

      const files = this.hasMediaAt({ record, at: bug.firstSeenAt })
        ? bugFilesOf(bug)
        : [];
      const keys = await this.keysOf({ files, record, token });

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

      if (!answer.isOk) {
        if (isSkippedEvidence(answer.error)) continue;

        return stateOfRefusal(answer);
      }

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
      ? {
          projectId,
          orgSlug: null,
          state: 'off',
          syncedAt: null,
          pending: [],
          conflicts: [],
        }
      : {
          projectId,
          orgSlug: record.orgSlug,
          state: record.state,
          syncedAt: record.syncedAt,
          pending: record.pending,
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
