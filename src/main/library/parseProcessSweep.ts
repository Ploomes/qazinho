import type { IProcessRow } from '@/main/types';

/** A program path may hold spaces, so the name is what comes before the first flag. */
function nameOf(command: string): string {
  const flag = command.search(/\s-{1,2}\w/);

  return (flag === -1 ? command : command.slice(0, flag)).trim();
}

/** Reads `ps -axo pid=,ppid=,pcpu=,rss=,args=`. The last field holds the whole command line. */
export function parseProcessSweep(output: string): IProcessRow[] {
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .flatMap((line) => {
      const [pid, parentPid, cpu, rssKb, ...rest] = line.split(/\s+/);

      if (pid === undefined || parentPid === undefined || rssKb === undefined) return [];

      const command = rest.join(' ');

      return [
        {
          pid: Number(pid),
          parentPid: Number(parentPid),
          cpu: Number(cpu ?? 0),
          ramMb: Number(rssKb) / 1024,
          name: nameOf(command),
          command,
        },
      ];
    })
    .filter((row) => Number.isFinite(row.pid) && Number.isFinite(row.ramMb));
}
