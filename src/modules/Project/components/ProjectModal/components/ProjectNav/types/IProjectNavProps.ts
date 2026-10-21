import type { IProjectNavItem } from './IProjectNavItem';
import type { ProjectSection } from '@/modules/Project/components/ProjectModal/types';

/** The project window's sections, the one open, and the words a screen reader says for a section that needs a look. */
export interface IProjectNavProps {
  label: string;
  items: IProjectNavItem[];
  current: ProjectSection;
  flagWord: string;
  onSelect: (section: ProjectSection) => void;
}
