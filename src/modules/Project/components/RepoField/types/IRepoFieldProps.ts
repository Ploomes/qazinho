import type { IProjectRepository } from '@/modules/Project/types';

export interface IRepoFieldProps {
  repositories: IProjectRepository[];
  onChange: (repositories: IProjectRepository[]) => void;
}
