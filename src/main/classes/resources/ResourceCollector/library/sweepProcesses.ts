import type { IProcessRow } from '@/main/types';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { parseProcessSweep } from '@/main/library';

const run = promisify(execFile);
const TIMEOUT_MS = 5_000;
const MAX_BUFFER = 10 * 1024 * 1024;

/**
 * Uma varredura `ps` do host inteiro responde por todo processo de uma vez num Mac ou
 * Linux; um `ps` por pid não escalaria. O Windows lê o próprio com o WindowsProcesses.
 */
export async function sweepProcesses(): Promise<IProcessRow[]> {
  if (process.platform === 'win32') return [];

  try {
    const { stdout } = await run('ps', ['-axo', 'pid=,ppid=,time=,rss=,args='], {
      timeout: TIMEOUT_MS,
      maxBuffer: MAX_BUFFER,
    });

    return parseProcessSweep(stdout);
  } catch {
    return [];
  }
}
