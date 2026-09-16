import type { ISidebarAddRow } from './ISidebarAddRow';
import type { ISidebarHeaderRow } from './ISidebarHeaderRow';
import type { ISidebarWorkspaceRow } from './ISidebarWorkspaceRow';

export type SidebarRow = ISidebarHeaderRow | ISidebarWorkspaceRow | ISidebarAddRow;
