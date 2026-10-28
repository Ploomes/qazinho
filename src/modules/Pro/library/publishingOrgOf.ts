import type { IProOrg } from '@/shared/types';

const PAID_UP = new Set(['trialing', 'active', 'past_due']);

/**
 * A org em que um projeto é publicado: a escolhida enquanto a pessoa escreve lá, senão a
 * primeira em que ela escreve e que está em dia.
 */
export function publishingOrgOf(props: {
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
