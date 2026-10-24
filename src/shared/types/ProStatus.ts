import type { IProOrg } from './IProOrg';

/** Where this machine stands with QAzinho Pro: signed out, or signed in with its account, its orgs and the one it sends its projects to, and whether the platform answered just now. */
export type ProStatus =
  | { isSignedIn: false; canKeepToken: boolean }
  | {
      isSignedIn: true;
      account: { email: string; name: string | null };
      machine: { id: string; name: string };
      orgs: IProOrg[];
      orgSlug: string | null;
      isReachable: boolean;
    };
