import type { ProjectSection } from '@/modules/Project/components/ProjectModal/types';

/**
 * Uma seção no nav da janela do projeto: o nome, quantas coisas guarda, se impede o
 * projeto de salvar, e se destrói.
 */
export interface IProjectNavItem {
  id: ProjectSection;
  label: string;
  count: number | null;
  isFlagged: boolean;
  isDanger: boolean;
}
