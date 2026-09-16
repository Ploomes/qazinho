/** A project id from the moment it was made, so two projects made apart never share one. */
export function newProjectId(now: number = Date.now()): string {
  return `p-${String(now)}`;
}
