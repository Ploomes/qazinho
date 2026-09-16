import type { IProcessRow } from '@/main/types';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { parseProcessSweep } from '@/main/library';

const run = promisify(execFile);
const TIMEOUT_MS = 5_000;
const MAX_BUFFER = 10 * 1024 * 1024;

/** One host-wide sweep answers for every process at once; one `ps` per pid would not scale. */
export async function sweepProcesses(): Promise<IProcessRow[]> {
  if (process.platform === 'win32') return [];

  try {
    const { stdout } = await run('ps', ['-axo', 'pid=,ppid=,pcpu=,rss=,comm='], {
      timeout: TIMEOUT_MS,
      maxBuffer: MAX_BUFFER,
    });

    return parseProcessSweep(stdout);
  } catch {
    return [];
  }
}
