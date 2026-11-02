import { open } from 'node:fs/promises';
import { join } from 'node:path';
import { IMPORT_SCAN } from '@/main/classes/integrations/ImportScanner/constants';

/**
 * Os arquivos YAML que abrem com `appId:`, que é como um fluxo do Maestro começa; lê só o
 * começo de cada um.
 */
export async function flowsIn(props: {
  root: string;
  files: string[];
}): Promise<string[]> {
  const candidates = props.files
    .filter((file) => /\.ya?ml$/i.test(file))
    .slice(0, IMPORT_SCAN.maxFlows);
  const heads = await Promise.all(
    candidates.map(async (file) => {
      const handle = await open(join(props.root, file), 'r').catch(() => null);

      if (handle === null) return '';

      try {
        const buffer = Buffer.alloc(IMPORT_SCAN.flowHeadBytes);
        const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);

        return buffer.subarray(0, bytesRead).toString('utf8');
      } finally {
        await handle.close();
      }
    }),
  );

  return candidates.filter((_, index) => /^appId:/m.test(heads[index] ?? ''));
}
