import { lstat, readdir } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Todo arquivo sob uma pasta com o tamanho dele, links deixados em paz; nada para uma
 * pasta que não existe.
 */
export async function filesUnder(
  root: string,
): Promise<{ path: string; size: number }[]> {
  const entries = await readdir(root, { recursive: true, withFileTypes: true }).catch(
    () => [],
  );
  const files: { path: string; size: number }[] = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const path = join(entry.parentPath, entry.name);
    const info = await lstat(path).catch(() => null);
    if (info?.isFile() === true) files.push({ path, size: info.size });
  }

  return files;
}
