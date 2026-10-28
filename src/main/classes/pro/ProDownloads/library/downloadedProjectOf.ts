import type { SyncedProject } from '@/main/classes/pro/ProDownloads/types';
import type { IProSyncProject } from '@/shared/types';

/**
 * O projeto como este computador o guarda: um endereço web só quando é um, e nenhum
 * build, que cada computador escolhe para si.
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
