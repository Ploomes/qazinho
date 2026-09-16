import type { IResourceSnapshot } from '@/types';
import { totalmem } from 'node:os';
import { collectSubtree } from '@/main/library';
import { sweepProcesses, toSample } from './library';

/** What gocrash costs this machine: the app itself, plus everything it started. */
export class ResourceCollector {
  private inflight: Promise<IResourceSnapshot> | null = null;

  /** Concurrent callers share one sweep: a burst of polls must not fork a `ps` each. */
  public async snapshot(): Promise<IResourceSnapshot> {
    this.inflight ??= this.collect().finally(() => {
      this.inflight = null;
    });

    return this.inflight;
  }

  private async collect(): Promise<IResourceSnapshot> {
    const rows = await sweepProcesses();
    const ours = rows.filter((row) => row.pid === process.pid);
    const processes = [...ours, ...collectSubtree({ rows, rootPid: process.pid })].map(
      toSample,
    );

    return {
      cpu: Math.round(processes.reduce((total, one) => total + one.cpu, 0) * 10) / 10,
      ramMb: processes.reduce((total, one) => total + one.ramMb, 0),
      ramCeilingGb: Math.round(totalmem() / 1024 ** 3),
      processes,
    };
  }
}
