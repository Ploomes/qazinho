import type { ISidebarAddRow } from './ISidebarAddRow';
import type { ISidebarSuiteRow } from './ISidebarSuiteRow';
import type { ISidebarWorkspaceRow } from './ISidebarWorkspaceRow';

export type SidebarGroupRow = ISidebarWorkspaceRow | ISidebarSuiteRow | ISidebarAddRow;
