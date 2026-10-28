/**
 * Por que o GitHub, ou a GitHub CLI por onde o QAzinho fala com ele, não respondeu como
 * pedido.
 */
export type GithubFailure =
  'no-cli' | 'signed-out' | 'denied' | 'not-found' | 'unreachable' | 'unexpected';
