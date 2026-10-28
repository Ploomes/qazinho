import type { StepVerdict } from '@/shared/types';

/**
 * Um veredito como uma run terminada o guarda: o que nunca passou de pendente ou rodando
 * foi pulado.
 */
export function finishedVerdictOf(
  verdict: StepVerdict,
): 'passed' | 'failed' | 'blocked' | 'skipped' {
  return verdict === 'pending' || verdict === 'running' ? 'skipped' : verdict;
}
