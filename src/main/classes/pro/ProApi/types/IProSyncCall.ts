/** One sync call to an org: the machine's token, the org, the path under its sync, and the body. */
export interface IProSyncCall {
  token: string;
  org: string;
  path: string;
  body: unknown;
}
