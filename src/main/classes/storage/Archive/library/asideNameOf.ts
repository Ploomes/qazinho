/** The name a plan that did not read is kept under, beside the plan, stamped so an older one is never written over. */
export function asideNameOf(at: Date): string {
  const stamp = at.toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '-');

  return `plan.unread-${stamp}.yaml`;
}
