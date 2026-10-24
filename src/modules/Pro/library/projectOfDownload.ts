import type { IProject } from '@/modules/Project/types';
import type { IProSyncProject } from '@/shared/types';

/** A project downloaded from the org as this computer keeps it. */
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
    repositories: project.repositories.map(({ owner, name, baseBranch }) => ({
      owner,
      name,
      baseBranch,
    })),
  };
}
