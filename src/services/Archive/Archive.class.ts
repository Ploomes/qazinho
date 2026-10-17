import type { ISavedState, ISavedWorkspace } from '@/types';
import { NOTHING_SAVED } from './constants';

/** The only caller of the disk side of the bridge. */
export class Archive {
  public static async read(): Promise<ISavedState> {
    return (await window.qazinho?.readState()) ?? NOTHING_SAVED;
  }

  public static saveProjects(json: string): void {
    void window.qazinho?.saveProjects(json);
  }

  public static saveWorkspace(saved: ISavedWorkspace): void {
    void window.qazinho?.saveWorkspace(saved);
  }

  public static removeWorkspace(workspaceId: string): void {
    void window.qazinho?.removeWorkspace(workspaceId);
  }

  public static async readShot(file: string): Promise<string | null> {
    return (await window.qazinho?.readShot(file)) ?? null;
  }
}
