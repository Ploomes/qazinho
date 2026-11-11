import type { ISidebarProBadge } from './ISidebarProBadge';
import type { SidebarGroupRow } from './SidebarGroupRow';
import type { ProjectMarkShape } from '@/modules/Project/types';

export interface ISidebarProjectGroup {
  id: string;
  projectId: string;
  name: string;
  initial: string;
  mark: ProjectMarkShape;
  place: string;
  hasPlace: boolean;
  tip: string;
  isSelected: boolean;
  isExpanded: boolean;
  pro: ISidebarProBadge | null;
  rows: SidebarGroupRow[];
  railRows: SidebarGroupRow[];
}
