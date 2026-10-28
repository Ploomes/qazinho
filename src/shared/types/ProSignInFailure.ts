/**
 * Por que entrar no QAzinho Pro parou no meio: sem resposta, um não no navegador, código
 * vencido, nenhum keychain para o token, ou uma resposta inesperada.
 */
export type ProSignInFailure =
  'unreachable' | 'denied' | 'expired' | 'no-keychain' | 'unexpected';
