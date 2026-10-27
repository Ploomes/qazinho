import type { IProOrg } from '@/shared/types';

const PAID_UP = new Set(['trialing', 'active', 'past_due']);

/**
 * The org this computer sends its projects to: the chosen one while writable, else the
 * first paid one.
 */
export function sendingOrgOf(props: {
  orgs: IProOrg[];
  chosen: string | null;
}): string | null {
  const writable = props.orgs.filter(({ role }) => role !== 'reader');

  if (writable.some(({ slug }) => slug === props.chosen)) return props.chosen;

  return (
    writable.find(({ billingStatus }) => PAID_UP.has(billingStatus))?.slug ??
    writable[0]?.slug ??
    null
  );
}
