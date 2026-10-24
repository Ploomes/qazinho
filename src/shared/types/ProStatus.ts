import type { IProOrg } from './IProOrg';

/** Where this machine stands with QAzinho Pro: signed out, or signed in with its account and orgs, and whether the platform answered just now. */
export type ProStatus =
  | { isSignedIn: false; canKeepToken: boolean }
  | {
      isSignedIn: true;
      account: { email: string; name: string | null };
      machine: { id: string; name: string };
      orgs: IProOrg[];
      isReachable: boolean;
    };
