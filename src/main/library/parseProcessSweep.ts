import type { IProcessRow } from '@/main/types';
import { parseCpuTime } from './parseCpuTime';

/** A program path may hold spaces, so the name is what comes before the first flag. */
function nameOf(command: string): string {
  const flag = command.search(/\s-{1,2}\w/);

  return (flag === -1 ? command : command.slice(0, flag)).trim();
}

/** Reads `ps -axo pid=,ppid=,time=,rss=,args=`. The last field holds the whole command line. */
export function parseProcessSweep(output: string): IProcessRow[] {
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .flatMap((line) => {
      const [pid, parentPid, time, rssKb, ...rest] = line.split(/\s+/);

      if (pid === undefined || parentPid === undefined || rssKb === undefined) return [];

      const command = rest.join(' ');

      return [
        {
          pid: Number(pid),
          parentPid: Number(parentPid),
          cpuSeconds: parseCpuTime(time ?? ''),
          ramMb: Number(rssKb) / 1024,
          name: nameOf(command),
          command,
        },
      ];
    })
    .filter((row) => Number.isFinite(row.pid) && Number.isFinite(row.ramMb));
}
