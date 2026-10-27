import type { IProUser } from './IProUser';
import type { IProOrg } from '@/shared/types';

/**
 * What a confirmed sign-in code trades for: this machine's token, the machine, the person
 * and their orgs.
 */
export interface IProDeviceToken {
  token: string;
  machine: { id: string; name: string };
  user: IProUser;
  orgs: IProOrg[];
}
