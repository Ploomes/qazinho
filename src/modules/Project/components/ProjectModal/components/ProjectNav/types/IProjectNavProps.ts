import type { IProjectNavItem } from './IProjectNavItem';
import type { ProjectSection } from '@/modules/Project/components/ProjectModal/types';

/**
 * As seções da janela do projeto, a aberta, e as palavras que um leitor de tela diz para
 * uma seção que precisa de atenção.
 */
export interface IProjectNavProps {
  label: string;
  items: IProjectNavItem[];
  current: ProjectSection;
  flagWord: string;
  onSelect: (section: ProjectSection) => void;
}
