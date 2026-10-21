import type { GithubFailure } from '@/shared/types';
import type { ParseKeys } from 'i18next';

export const GITHUB_FAILURE_KEYS: Record<GithubFailure, ParseKeys> = {
  'no-cli': 'GITHUB.FAILURE_NO_CLI',
  'signed-out': 'GITHUB.FAILURE_SIGNED_OUT',
  denied: 'GITHUB.FAILURE_DENIED',
  'not-found': 'GITHUB.FAILURE_NOT_FOUND',
  unreachable: 'GITHUB.FAILURE_UNREACHABLE',
  unexpected: 'GITHUB.FAILURE_UNEXPECTED',
};
