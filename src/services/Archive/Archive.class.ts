import type {
  ISavedState,
  ISavedWorkspace,
  SaveOutcome,
  UnreadPlanRead,
} from '@/shared/types';
import { NOTHING_SAVED } from './constants';

/** O único que chama o lado do disco da bridge. */
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

  public static async readUnreadPlan(unread: {
    workspaceId: string;
    file: string;
  }): Promise<UnreadPlanRead> {
    return (await window.qazinho?.readUnreadPlan(unread)) ?? { status: 'gone' };
  }

  public static showUnreadPlan(unread: { workspaceId: string; file: string }): void {
    void window.qazinho?.showUnreadPlan(unread);
  }

  public static async readShot(file: string): Promise<string | null> {
    return (await window.qazinho?.readShot(file)) ?? null;
  }

  public static async saveShot(props: {
    file: string | null;
    src: string | null;
    name: string;
  }): Promise<SaveOutcome> {
    return (await window.qazinho?.saveShot(props)) ?? 'failed';
  }
}
