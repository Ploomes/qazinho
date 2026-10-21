import type { IProjectRepository } from '@/modules/Project/types';
import type { BuildPlatform } from '@/shared/types';

/** Building one platform of a project from its code: the repositories to pick from, the build on show, and what the modal keeps of it. */
export interface IBuildFromCodeProps {
  platform: BuildPlatform;
  projectId: string | null;
  repositories: IProjectRepository[];
  buildId: string | null;
  onStart: (buildId: string) => void;
  onReset: () => void;
}
