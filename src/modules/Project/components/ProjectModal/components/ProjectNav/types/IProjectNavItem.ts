import type { ProjectSection } from '@/modules/Project/components/ProjectModal/types';

/** A section in the project window's nav: its name, how many things it holds, whether it keeps the project from saving, and whether it destroys. */
export interface IProjectNavItem {
  id: ProjectSection;
  label: string;
  count: number | null;
  isFlagged: boolean;
  isDanger: boolean;
}
