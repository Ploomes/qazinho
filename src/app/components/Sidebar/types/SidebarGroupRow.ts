import type { ISidebarAddRow } from './ISidebarAddRow';
import type { ISidebarBugsRow } from './ISidebarBugsRow';
import type { ISidebarWorkspaceRow } from './ISidebarWorkspaceRow';

export type SidebarGroupRow = ISidebarWorkspaceRow | ISidebarBugsRow | ISidebarAddRow;
