import type { FilingFailure, GithubFailure } from '@/shared/types';

const FAILURES: Record<GithubFailure, FilingFailure> = {
  'no-cli': 'not-connected',
  'signed-out': 'unauthorized',
  denied: 'unauthorized',
  'not-found': 'not-found',
  unreachable: 'unreachable',
  unexpected: 'unexpected',
};

/**
 * Por que o GitHub não aceitou um bug: gh sumido ou deslogado, repositório recusado ou
 * ausente, fora de alcance, ou o que o GitHub se recusou a aceitar.
 */
export function filingFailureOf(props: {
  failure: GithubFailure;
  httpStatus: number | null;
}): FilingFailure {
  return props.httpStatus === 422 || props.httpStatus === 410
    ? 'rejected'
    : FAILURES[props.failure];
}
