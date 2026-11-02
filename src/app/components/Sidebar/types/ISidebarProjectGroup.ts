import type { ISidebarProBadge } from './ISidebarProBadge';
import type { SidebarGroupRow } from './SidebarGroupRow';

export interface ISidebarProjectGroup {
  id: string;
  projectId: string;
  name: string;
  initial: string;
  isSelected: boolean;
  isExpanded: boolean;
  meta: string;
  pro: ISidebarProBadge | null;
  rows: SidebarGroupRow[];
}
