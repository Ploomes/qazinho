import type { ProDownloadState } from './ProDownloadState';

/**
 * Como trazer para cá um dos projetos da org terminou: os workspaces que trouxe, ou por
 * que não.
 */
export type OrgDownloadEnd =
  | { isDownloaded: true; workspaceIds: string[] }
  | { isDownloaded: false; failure: Exclude<ProDownloadState, 'working'> };
