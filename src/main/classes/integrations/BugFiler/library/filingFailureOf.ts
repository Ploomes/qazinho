import type { FilingFailure, GithubFailure } from '@/shared/types';

const FAILURES: Record<GithubFailure, FilingFailure> = {
  'no-cli': 'not-connected',
  'signed-out': 'unauthorized',
  denied: 'unauthorized',
  'not-found': 'not-found',
  unreachable: 'unreachable',
  unexpected: 'unexpected',
};

/** Why GitHub did not take a bug, as a filing says it: gh gone or signed out, the repository refused or not there, out of reach, or what GitHub refused to take. */
export function filingFailureOf(props: {
  failure: GithubFailure;
  httpStatus: number | null;
}): FilingFailure {
  return props.httpStatus === 422 || props.httpStatus === 410
    ? 'rejected'
    : FAILURES[props.failure];
}
