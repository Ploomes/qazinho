import type { ISavedState, ISavedWorkspace } from '@/types';

const NOTHING: ISavedState = { projects: '[]', workspaces: [] };

/** The only caller of the disk side of the bridge. */
export class Archive {
  public static async read(): Promise<ISavedState> {
    return (await window.gocrash?.readState()) ?? NOTHING;
  }

  public static saveProjects(json: string): void {
    void window.gocrash?.saveProjects(json);
  }

  public static saveWorkspace(saved: ISavedWorkspace): void {
    void window.gocrash?.saveWorkspace(saved);
  }

  public static removeWorkspace(workspaceId: string): void {
    void window.gocrash?.removeWorkspace(workspaceId);
  }

  public static async readShot(file: string): Promise<string | null> {
    return (await window.gocrash?.readShot(file)) ?? null;
  }
}
