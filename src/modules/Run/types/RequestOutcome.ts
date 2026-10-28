/**
 * Como um pedido terminou: uma resposta pela classe do status, uma falha no caminho, uma
 * que o app abandonou, ou nenhuma resposta ouvida.
 */
export type RequestOutcome =
  'ok' | 'redirect' | 'client' | 'server' | 'failed' | 'canceled' | 'unknown';
