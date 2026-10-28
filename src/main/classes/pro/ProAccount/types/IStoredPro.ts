import type { IProOrg } from '@/shared/types';

/**
 * O que esta máquina guarda lacrado do login: o token, a máquina, a conta, e as orgs dela
 * como da última resposta.
 */
export interface IStoredPro {
  token: string;
  machine: { id: string; name: string };
  account: { email: string; name: string | null };
  orgs: IProOrg[];
}
