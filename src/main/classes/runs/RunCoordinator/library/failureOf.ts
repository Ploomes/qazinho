import type { RunFailure } from '@/shared/types';
import { stripAnsi } from '@/main/library';

const UNREACHABLE = /net::(ERR_[A-Z_]+) at (\S+)/;

/**
 * O que parou uma run, a partir do erro que ela lançou: uma página que o Chrome não
 * alcançou, ou a primeira linha das palavras da máquina.
 */
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
