import type { ProDownloadState } from './ProDownloadState';

/**
 * How bringing one of the org's projects here ended: the workspaces it brought, or why it
 * did not.
 */
export type OrgDownloadEnd =
  | { isDownloaded: true; workspaceIds: string[] }
  | { isDownloaded: false; failure: Exclude<ProDownloadState, 'working'> };
