import type { RunFailure } from '@/shared/types';
import { stripAnsi } from '@/main/library';

const UNREACHABLE = /net::(ERR_[A-Z_]+) at (\S+)/;

/** What stopped a run, out of the error it threw: a page Chrome could not reach, or the first line of the machine's words. */
export function failureOf(reason: unknown): RunFailure {
  const said = stripAnsi(
    reason instanceof Error ? reason.message : String(reason),
  ).trim();
  const unreachable = UNREACHABLE.exec(said);

  if (unreachable !== null)
    return {
      reason: 'unreachable',
      code: unreachable[1] ?? '',
      url: unreachable[2] ?? '',
    };

  return { reason: 'other', said: said.split('\n')[0] ?? said };
}
