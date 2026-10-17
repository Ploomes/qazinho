import type { PickKind } from '@/types';

export const FILE_FILTERS: Record<PickKind, { name: string; extensions: string[] }> = {
  apk: { name: 'Android build', extensions: ['apk'] },
  app: { name: 'Simulator build', extensions: ['app'] },
};
