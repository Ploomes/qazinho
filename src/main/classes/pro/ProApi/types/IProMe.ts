import type { IProUser } from './IProUser';
import type { IProOrg } from '@/shared/types';

/** A conta a que um token pertence, e as orgs de que ela é membro. */
export interface IProMe {
  user: IProUser;
  orgs: IProOrg[];
}
