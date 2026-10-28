import type { IProOrg } from './IProOrg';

/**
 * Em que pé esta máquina está com a conta do QA: deslogada, ou logada com as orgs dela.
 */
export type ProStatus =
  | { isSignedIn: false; canKeepToken: boolean }
  | {
      isSignedIn: true;
      account: { email: string; name: string | null };
      machine: { id: string; name: string };
      orgs: IProOrg[];
      isReachable: boolean;
    };
