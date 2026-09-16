import type { IProcessRow } from '@/main/types';

/** Reads `ps -axo pid=,ppid=,pcpu=,rss=,comm=`. The last field may hold spaces. */
export function parseProcessSweep(output: string): IProcessRow[] {
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .flatMap((line) => {
      const [pid, parentPid, cpu, rssKb, ...command] = line.split(/\s+/);

      if (pid === undefined || parentPid === undefined || rssKb === undefined) return [];

      return [
        {
          pid: Number(pid),
          parentPid: Number(parentPid),
          cpu: Number(cpu ?? 0),
          ramMb: Number(rssKb) / 1024,
          name: command.join(' '),
        },
      ];
    })
    .filter((row) => Number.isFinite(row.pid) && Number.isFinite(row.ramMb));
}
