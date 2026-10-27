import type { IProOrg } from './IProOrg';

/**
 * Where this machine stands with the QA's account: signed out, or signed in with its
 * orgs.
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
