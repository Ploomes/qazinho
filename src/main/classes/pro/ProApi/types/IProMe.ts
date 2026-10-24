import type { IProUser } from './IProUser';
import type { IProOrg } from '@/shared/types';

/** The account a token belongs to, and the orgs it is a member of. */
export interface IProMe {
  user: IProUser;
  orgs: IProOrg[];
}
