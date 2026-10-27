import type { IProOrg } from '@/shared/types';

/**
 * What this machine keeps sealed about its sign-in: the token, the machine, the account,
 * its orgs as of the last answer, and the org it sends its projects to.
 */
export interface IStoredPro {
  token: string;
  machine: { id: string; name: string };
  account: { email: string; name: string | null };
  orgs: IProOrg[];
  orgSlug: string | null;
}
