import type { IProcessRow } from '@/main/types';

const TICKS_PER_SECOND = 10_000_000;
const BYTES_IN_MB = 1024 * 1024;

/**
 * Reads the sweep the PowerShell side writes, a tab between each field: pid, parent, cpu
 * time in 100 ns ticks, working set in bytes, name and command line.
 */
export function parseWindowsSweep(output: string): IProcessRow[] {
  return output.split(/\r?\n/).flatMap((line) => {
    const [pid, parentPid, ticks, bytes, name, ...command] = line.split('\t');

    if (
      pid === undefined ||
      parentPid === undefined ||
      bytes === undefined ||
      name === undefined
    )
      return [];

    const row = {
      pid: Number(pid),
      parentPid: Number(parentPid),
      cpuSeconds: Number(ticks || 0) / TICKS_PER_SECOND,
      ramMb: Number(bytes || 0) / BYTES_IN_MB,
      name: name.replace(/\.exe$/i, ''),
      command: command.join('\t').trim() || name,
    };

    return Number.isFinite(row.pid) && pid !== '' && Number.isFinite(row.ramMb)
      ? [row]
      : [];
  });
}
