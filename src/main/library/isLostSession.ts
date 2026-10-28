const LOST =
  /no conversation found|no (rollout|session|thread) found|(session|thread|conversation)\b.{0,80}?\bnot found/i;

/**
 * Se um agente se recusou a seguir com uma sessão que não tem mais, como uma que ele
 * limpou ou que outro agente iniciou.
 */
export function isLostSession(said: string): boolean {
  return LOST.test(said);
}
