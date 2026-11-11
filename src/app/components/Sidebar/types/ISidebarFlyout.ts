import type { ISidebarWorkspaceRow } from './ISidebarWorkspaceRow';
import type { ProjectMarkShape } from '@/modules/Project/types';

/** O painel de um projeto ao lado da barra recolhida: onde fica e os planos dele. */
export interface ISidebarFlyout {
  projectId: string;
  name: string;
  place: string;
  mark: ProjectMarkShape;
  plans: ISidebarWorkspaceRow[];
  top: number;
  left: number;
}
