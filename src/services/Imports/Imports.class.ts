import type { ImportPick } from '@/shared/types';

/**
 * O único que chama o lado do importador da bridge: abre o seletor de pasta e devolve o
 * que a main leu nela.
 */
export class Imports {
  public static async pick(): Promise<ImportPick> {
    return (await window.qazinho?.pickImport()) ?? { kind: 'cancelled' };
  }
}
