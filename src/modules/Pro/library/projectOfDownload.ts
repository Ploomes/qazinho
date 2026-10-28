import type { IProject } from '@/modules/Project/types';
import type { IProSyncProject } from '@/shared/types';

/** Um projeto baixado da org como este computador o guarda. */
export function projectOfDownload(project: IProSyncProject): IProject {
  return {
    id: project.projectId,
    name: project.name,
    targets: project.targets.map(({ id, kind, label, value }) => ({
      id,
      kind,
      label,
      value,
    })),
    repositories: project.repositories.map(({ id, owner, name, baseBranch }) => ({
      id,
      owner,
      name,
      baseBranch,
    })),
  };
}
