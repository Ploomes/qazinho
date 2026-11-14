import type { AppUpdate } from '@/shared/types';
import { NO_UPDATE } from './constants';

/** O único que chama o lado da atualização do app da bridge. */
export class Updates {
  public static async state(): Promise<AppUpdate> {
    return (await window.qazinho?.appUpdate()) ?? NO_UPDATE;
  }

  /** Fecha o app e instala a versão que já foi baixada. */
  public static install(): void {
    void window.qazinho?.installUpdate();
  }

  /** Abre as atualizações da Microsoft Store, de onde uma cópia da loja se atualiza. */
  public static openStore(): void {
    void window.qazinho?.openStoreUpdates();
  }

  public static onChange(listener: (update: AppUpdate) => void): () => void {
    return window.qazinho?.onAppUpdate(listener) ?? (() => undefined);
  }
}
