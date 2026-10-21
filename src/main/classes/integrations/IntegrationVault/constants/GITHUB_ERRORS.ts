import type { GithubFailure } from '@/shared/types';

export const GITHUB_ERRORS: Record<GithubFailure | 'scopes', string> = {
  'no-cli':
    'QAzinho reaches GitHub through the GitHub CLI, and it is not on this machine.',
  'signed-out': 'The GitHub CLI is not signed in to GitHub on this machine.',
  scopes: 'The GitHub CLI is signed in without access to {scopes}.',
  denied: "GitHub refused the GitHub CLI's login. Sign it in again.",
  'not-found': 'GitHub did not find the account the GitHub CLI is signed in as.',
  unreachable: 'QAzinho could not reach GitHub from this machine. Check the network.',
  unexpected: 'GitHub answered in a way QAzinho did not expect.',
};
