/**
 * Why signing the GitHub CLI in stopped short: gh is not here, GitHub refused, the code
 * expired, or gh closed.
 */
export type GithubSignInFailure = 'missing' | 'refused' | 'timeout' | 'closed';
