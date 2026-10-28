import type { IProUser } from './IProUser';
import type { IProOrg } from '@/shared/types';

/**
 * Pelo que um código de login confirmado se troca: o token desta máquina, a máquina, a
 * pessoa e as orgs dela.
 */
export interface IProDeviceToken {
  token: string;
  machine: { id: string; name: string };
  user: IProUser;
  orgs: IProOrg[];
}
