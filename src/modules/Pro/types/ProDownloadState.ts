import type { ProDownload } from '@/shared/types';

/** Em que pé está o download de um dos projetos da org: andando, ou por que não. */
export type ProDownloadState =
  'working' | Extract<ProDownload, { isDownloaded: false }>['failure'];
