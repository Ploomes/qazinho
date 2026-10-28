import type { PickKind } from '@/shared/types';

/**
 * O único que chama o lado de escolher arquivos da bridge. Uma página não consegue abrir
 * um diálogo.
 */
export class Files {
  public static async pick(kind: PickKind): Promise<string | null> {
    return (await window.qazinho?.pickFile(kind)) ?? null;
  }
}
