import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

/** Os arquivos que um plano guarda, um por conteúdo, pelo nome de cada um. */
export async function storedFilesOf(
  store: string,
): Promise<{ name: string; path: string }[]> {
  const folders = await readdir(store).catch(() => []);
  const listed = await Promise.all(
    folders.map(async (folder) =>
      (await readdir(join(store, folder)).catch(() => []))
        .filter((name) => !name.endsWith('.part'))
        .map((name) => ({ name, path: join(store, folder, name) })),
    ),
  );

  return listed.flat();
}
