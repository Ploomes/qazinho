import type { IInstallResult, InstallableId, ISetupEvent } from '@/types';
import { NO_INSTALL } from './constants';

/** The only caller of the install side of the bridge. */
export class Setup {
  public static async install(item: InstallableId): Promise<IInstallResult> {
    return (await window.gocrash?.installTool(item)) ?? NO_INSTALL;
  }

  public static onEvent(listener: (event: ISetupEvent) => void): () => void {
    return window.gocrash?.onSetupEvent(listener) ?? (() => undefined);
  }
}
