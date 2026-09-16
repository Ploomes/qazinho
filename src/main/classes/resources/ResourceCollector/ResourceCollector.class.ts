import type { IResourceCollector } from './types';
import type { ProcessOwners } from '@/main/classes/resources/ProcessOwners';
import type { IProcessRow } from '@/main/types';
import type { IProcessSample, IResourceSnapshot } from '@/types';
import { availableParallelism, totalmem } from 'node:os';
import { collectSubtree } from '@/main/library';
import { BYTES_IN_GB } from './constants';
import { cpuPercent, sweepProcesses, toSample, workspaceOfProfile } from './library';

/** What gocrash costs this machine: the app itself, plus everything it started. */
export class ResourceCollector {
  private readonly owners: ProcessOwners;
  private readonly profileRoot: string;
  private inflight: Promise<IResourceSnapshot> | null = null;
  private cpuSecondsBefore = new Map<number, number>();
  private sweptAt = 0;

  public constructor(props: IResourceCollector) {
    this.owners = props.owners;
    this.profileRoot = props.profileRoot;
  }

  /** Concurrent callers share one sweep: a burst of polls must not fork a `ps` each. */
  public async snapshot(): Promise<IResourceSnapshot> {
    this.inflight ??= this.collect().finally(() => {
      this.inflight = null;
    });

    return this.inflight;
  }

  private async collect(): Promise<IResourceSnapshot> {
    // The sweep's own ps is a child of this process, and not something gocrash is running.
    const rows = (await sweepProcesses()).filter(
      (row) => !(row.parentPid === process.pid && row.name === 'ps'),
    );
    const now = Date.now();
    const elapsedMs = this.sweptAt === 0 ? 0 : now - this.sweptAt;
    const cores = availableParallelism();
    const mine = rows.filter((row) => row.pid === process.pid);
    const processes = [...mine, ...collectSubtree({ rows, rootPid: process.pid })].map(
      (row) =>
        this.charge({
          row,
          rows,
          cpu: cpuPercent({
            before: this.cpuSecondsBefore.get(row.pid),
            after: row.cpuSeconds,
            elapsedMs,
            cores,
          }),
        }),
    );

    this.cpuSecondsBefore = new Map(rows.map((row) => [row.pid, row.cpuSeconds]));
    this.sweptAt = now;

    return {
      cpu: Math.round(processes.reduce((total, one) => total + one.cpu, 0) * 10) / 10,
      ramMb: processes.reduce((total, one) => total + one.ramMb, 0),
      ramCeilingGb: Math.round(totalmem() / BYTES_IN_GB),
      processes,
    };
  }

  private charge(props: {
    row: IProcessRow;
    rows: IProcessRow[];
    cpu: number;
  }): IProcessSample {
    const { row, rows, cpu } = props;

    for (const [pid, claim] of this.owners.all()) {
      const owned =
        row.pid === pid ||
        collectSubtree({ rows, rootPid: pid }).some((kid) => kid.pid === row.pid);

      if (owned) return toSample({ row, cpu, ...claim });
    }

    const workspaceId = workspaceOfProfile({
      command: row.command,
      profileRoot: this.profileRoot,
    });

    return workspaceId === null
      ? toSample({ row, cpu, kind: 'app', workspaceId: null })
      : toSample({ row, cpu, kind: 'device', workspaceId });
  }
}
