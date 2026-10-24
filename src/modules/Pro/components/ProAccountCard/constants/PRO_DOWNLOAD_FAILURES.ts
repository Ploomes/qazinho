import type { ProDownloadState } from '@/modules/Pro/types';
import type { ParseKeys } from 'i18next';

export const PRO_DOWNLOAD_FAILURES: Record<
  Exclude<ProDownloadState, 'working'>,
  ParseKeys
> = {
  'signed-out': 'PRO.DOWNLOAD_SIGNED_OUT',
  unreachable: 'PRO.DOWNLOAD_UNREACHABLE',
  gone: 'PRO.DOWNLOAD_GONE',
  here: 'PRO.DOWNLOAD_HERE',
  failed: 'PRO.DOWNLOAD_FAILED',
};
