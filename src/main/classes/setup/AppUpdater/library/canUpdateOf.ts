/**
 * Se este app se atualiza sozinho: instalado de verdade ou apontado para um feed; no
 * Linux, só um AppImage, e nunca uma cópia da Microsoft Store.
 */
export function canUpdateOf({
  platform,
  isPackaged,
  hasFeed,
  appImage,
  isStore,
}: {
  platform: NodeJS.Platform;
  isPackaged: boolean;
  hasFeed: boolean;
  appImage: string | undefined;
  isStore: boolean;
}): boolean {
  if (isStore) return false;
  if (hasFeed) return true;
  if (!isPackaged) return false;

  return platform !== 'linux' || appImage !== undefined;
}
