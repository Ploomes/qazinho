/**
 * Por que ler da org não funcionou, como o QA lê: deslogado, nenhuma resposta, ou uma
 * recusa.
 */
export function fetchFailureOf(answer: {
  status: number;
}): 'signed-out' | 'unreachable' | 'failed' {
  if (answer.status === 401) return 'signed-out';

  return answer.status === 0 || answer.status >= 500 ? 'unreachable' : 'failed';
}
