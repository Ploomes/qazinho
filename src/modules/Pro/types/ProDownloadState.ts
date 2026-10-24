import type { ProDownload } from '@/shared/types';

/** Where downloading one of the org's projects stands: going, or why it did not. */
export type ProDownloadState =
  'working' | Extract<ProDownload, { isDownloaded: false }>['failure'];
