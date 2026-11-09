import { copyFile, mkdir, stat } from 'node:fs/promises';
import { basename, join } from 'node:path';
import {
  fileFactsOf,
  fileRefOf,
  readFileRef,
} from '@salve-software/qazinho-harness/engine';

/**
 * O caminho que o navegador recebe para um arquivo do QA, ou null se a run não o tem: o
 * arquivo é guardado no plano pelo conteúdo, e a gravação aprende como nomeá-lo.
 */
export function uploadPathOf(props: {
  canUpload: (file: string) => boolean;
  attachments: { name: string; path: string }[];
  store: string;
  refs: Map<string, string>;
}): (file: string) => Promise<string | null> {
  const { canUpload, attachments, store, refs } = props;

  return async (file) => {
    const read = readFileRef(file);

    if (read !== null) {
      const kept = join(store, read.sha256, read.name);

      return (await stat(kept).catch(() => null))?.isFile() === true ? kept : null;
    }

    if (!canUpload(file)) return null;

    const facts = await fileFactsOf(file);

    if (facts === null) return file;

    const name = attachments.find(({ path }) => path === file)?.name ?? basename(file);
    const folder = join(store, facts.sha256);
    const kept = join(folder, name);

    if ((await stat(kept).catch(() => null))?.isFile() !== true) {
      await mkdir(folder, { recursive: true });
      await copyFile(file, kept);
    }

    refs.set(file, fileRefOf({ sha256: facts.sha256, name }));

    return kept;
  };
}
