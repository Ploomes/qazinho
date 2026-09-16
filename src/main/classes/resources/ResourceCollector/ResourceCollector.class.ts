import type { IResourceCollector } from './types';
import type { ProcessOwners } from '@/main/classes/resources/ProcessOwners';
import type { IProcessRow } from '@/main/types';
import type { IProcessSample, IResourceSnapshot } from '@/types';
import { totalmem } from 'node:os';
import { collectSubtree } from '@/main/library';
import { sweepProcesses, toSample, workspaceOfProfile } from './library';

const BYTES_IN_GB = 1024 ** 3;

/** What gocrash costs this machine: the app itself, plus everything it started. */
export class ResourceCollector {
  private readonly owners: ProcessOwners;
  private readonly profileRoot: string;
  private inflight: Promise<IResourceSnapshot> | null = null;

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
    const rows = await sweepProcesses();
    const mine = rows.filter((row) => row.pid === process.pid);
    const processes = [...mine, ...collectSubtree({ rows, rootPid: process.pid })].map(
      (row) => this.charge({ row, rows }),
    );

    return {
      cpu: Math.round(processes.reduce((total, one) => total + one.cpu, 0) * 10) / 10,
      ramMb: processes.reduce((total, one) => total + one.ramMb, 0),
      ramCeilingGb: Math.round(totalmem() / BYTES_IN_GB),
      processes,
    };
  }

  private charge(props: { row: IProcessRow; rows: IProcessRow[] }): IProcessSample {
    const { row, rows } = props;

    for (const [pid, claim] of this.owners.all()) {
      const owned =
        row.pid === pid ||
        collectSubtree({ rows, rootPid: pid }).some((kid) => kid.pid === row.pid);

      if (owned) return toSample({ row, ...claim });
    }

    const workspaceId = workspaceOfProfile({
      command: row.command,
      profileRoot: this.profileRoot,
    });

    return workspaceId === null
      ? toSample({ row, kind: 'app', workspaceId: null })
      : toSample({ row, kind: 'device', workspaceId });
  }
}
