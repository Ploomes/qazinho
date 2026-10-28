import type { IProjectRepository } from '@/modules/Project/types';
import type { BuildPlatform } from '@/shared/types';

/**
 * Construindo uma plataforma de um projeto a partir do código: os repositórios a
 * escolher, o build em exibição, e o que o modal guarda dele.
 */
export interface IBuildFromCodeProps {
  platform: BuildPlatform;
  projectId: string | null;
  repositories: IProjectRepository[];
  buildId: string | null;
  onStart: (buildId: string) => void;
  onReset: () => void;
}
