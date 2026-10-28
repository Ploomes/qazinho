import { extname } from 'node:path';
import { ARCHIVE } from '@/main/classes/storage/Archive/constants';
import { STORAGE_KEEPER } from '@/main/classes/storage/StorageKeeper/constants';

const VIDEOS: readonly string[] = Object.values(ARCHIVE.videos);
const SCREENS: readonly string[] = STORAGE_KEEPER.screens;

/** O que um arquivo na pasta de uma run é: o vídeo dela, uma tela, ou outra coisa. */
export function runFileKindOf(name: string): 'video' | 'screen' | null {
  if (VIDEOS.includes(name)) return 'video';

  return SCREENS.includes(extname(name).toLowerCase()) ? 'screen' : null;
}
