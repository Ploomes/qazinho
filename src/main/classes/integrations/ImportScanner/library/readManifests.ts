import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { IMPORT_SCAN } from '@/main/classes/integrations/ImportScanner/constants';

/**
 * O texto dos manifestos de dependência perto da raiz (package.json, requirements,
 * pom.xml…), juntos, para procurar nomes de pacote.
 */
export async function readManifests(props: {
  root: string;
  files: string[];
}): Promise<string> {
  const names: readonly string[] = IMPORT_SCAN.manifestNames;
  const manifests = props.files.filter(
    (file) =>
      file.split('/').length <= IMPORT_SCAN.manifestDepth &&
      names.includes(file.split('/').at(-1) ?? ''),
  );
  const texts = await Promise.all(
    manifests.map(async (file) =>
      (await readFile(join(props.root, file), 'utf8').catch(() => '')).slice(
        0,
        IMPORT_SCAN.manifestBytes,
      ),
    ),
  );

  return texts.join('\n');
}
