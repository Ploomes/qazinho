import type { SyncedProject } from '@/main/classes/pro/ProDownloads/types';
import type { IProSyncProject } from '@/shared/types';

/**
 * The project as this computer keeps it: a web address only when it is one, and no build,
 * which each computer picks for itself.
 */
export function downloadedProjectOf(project: SyncedProject): IProSyncProject {
  return {
    projectId: project.desktopId,
    name: project.name,
    targets: project.targets.map((target) => ({
      ...target,
      value:
        target.kind === 'web' && /^https?:\/\//i.test(target.value) ? target.value : '',
    })),
    repositories: project.repositories,
  };
}
