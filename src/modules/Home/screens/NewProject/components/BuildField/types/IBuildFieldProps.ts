import type { IProjectBuild } from '@/modules/Home/types';

/** Os builds que o QA escolheu, um por plataforma. */
export interface IBuildFieldProps {
  value: IProjectBuild[];
  onChange: (value: IProjectBuild[]) => void;
}
