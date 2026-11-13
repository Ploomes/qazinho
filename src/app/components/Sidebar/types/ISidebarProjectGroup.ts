import type { ISidebarProBadge } from './ISidebarProBadge';
import type { ISidebarSignal } from './ISidebarSignal';
import type { ISidebarWorkspaceRow } from './ISidebarWorkspaceRow';
import type { SidebarGroupRow } from './SidebarGroupRow';
import type { ProjectMarkShape } from '@/modules/Project/types';

export interface ISidebarProjectGroup {
  id: string;
  projectId: string;
  name: string;
  nameClassName: string;
  initial: string;
  mark: ProjectMarkShape;
  place: string;
  hasPlace: boolean;
  tip: string;
  isSelected: boolean;
  isExpanded: boolean;
  pro: ISidebarProBadge | null;
  rows: SidebarGroupRow[];
  plans: ISidebarWorkspaceRow[];
  signal: ISidebarSignal | null;
  railLabel: string;
}
