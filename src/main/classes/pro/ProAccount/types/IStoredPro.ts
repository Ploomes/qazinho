import type { IProOrg } from '@/shared/types';

/**
 * What this machine keeps sealed about its sign-in: the token, the machine, the account,
 * and its orgs as of the last answer.
 */
export interface IStoredPro {
  token: string;
  machine: { id: string; name: string };
  account: { email: string; name: string | null };
  orgs: IProOrg[];
}
