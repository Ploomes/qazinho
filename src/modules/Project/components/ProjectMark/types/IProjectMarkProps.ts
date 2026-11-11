import type { ProjectMarkShape } from '@/modules/Project/types';

/** O projeto a desenhar, pela marca que ele tem, e o lado do quadrado em px. */
export interface IProjectMarkProps {
  mark: ProjectMarkShape;
  size: number;
}
