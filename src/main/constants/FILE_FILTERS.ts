import type { PickKind } from '@/types';

/** macOS shows a `.app` as one file even though it is a folder, so both are picked as files. */
export const FILE_FILTERS: Record<PickKind, { name: string; extensions: string[] }> = {
  apk: { name: 'Android build', extensions: ['apk'] },
  app: { name: 'Simulator build', extensions: ['app'] },
};
