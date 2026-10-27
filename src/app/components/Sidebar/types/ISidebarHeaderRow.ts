import type { ISidebarProBadge } from './ISidebarProBadge';

export interface ISidebarHeaderRow {
  kind: 'header';
  id: string;
  projectId: string;
  name: string;
  pro: ISidebarProBadge | null;
}
