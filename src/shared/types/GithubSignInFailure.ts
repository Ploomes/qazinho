/**
 * Por que o login da GitHub CLI parou no meio: o gh não está aqui, o GitHub recusou, o
 * código venceu, ou o gh fechou.
 */
export type GithubSignInFailure = 'missing' | 'refused' | 'timeout' | 'closed';
