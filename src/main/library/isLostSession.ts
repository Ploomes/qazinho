const LOST =
  /no conversation found|no (rollout|session|thread) found|(session|thread|conversation)\b.{0,80}?\bnot found/i;

/**
 * Whether an agent refused to go on with a session it no longer has, such as one it
 * cleaned up or another agent started.
 */
export function isLostSession(said: string): boolean {
  return LOST.test(said);
}
