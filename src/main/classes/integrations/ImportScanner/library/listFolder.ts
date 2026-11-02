import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { IMPORT_SCAN } from '@/main/classes/integrations/ImportScanner/constants';

/**
 * Os arquivos de uma pasta como caminhos relativos, sem as pastas de dependência e de
 * build, até um teto de arquivos.
 */
export async function listFolder(root: string): Promise<string[]> {
  const files: string[] = [];
  const skipped: readonly string[] = IMPORT_SCAN.skippedFolders;
  const walk = async (relative: string, depth: number): Promise<void> => {
    const entries = await readdir(join(root, relative), { withFileTypes: true }).catch(
      () => [],
    );

    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (files.length >= IMPORT_SCAN.maxFiles) return;

      const path = relative === '' ? entry.name : `${relative}/${entry.name}`;

      if (entry.isDirectory()) {
        if (!skipped.includes(entry.name) && depth < IMPORT_SCAN.maxDepth)
          await walk(path, depth + 1);
      } else if (entry.isFile()) files.push(path);
    }
  };

  await walk('', 0);

  return files;
}
