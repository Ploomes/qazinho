/**
 * Se este app consegue se atualizar: instalado de verdade ou apontado para um feed; no
 * Linux, só um AppImage.
 */
export function canUpdateOf({
  platform,
  isPackaged,
  hasFeed,
  appImage,
}: {
  platform: NodeJS.Platform;
  isPackaged: boolean;
  hasFeed: boolean;
  appImage: string | undefined;
}): boolean {
  if (hasFeed) return true;
  if (!isPackaged) return false;

  return platform !== 'linux' || appImage !== undefined;
}
