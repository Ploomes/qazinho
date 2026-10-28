/**
 * Um id de projeto a partir do momento em que foi feito, para dois projetos feitos
 * separados nunca dividirem um.
 */
export function newProjectId(now: number = Date.now()): string {
  return `p-${String(now)}`;
}
