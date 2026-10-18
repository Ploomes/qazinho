import type { ToolGroup } from './ToolGroup';
import type { HarnessRole } from '@/harness/types';

/** Which roles may use a tool group; a role no grant names gets no tool at all. */
export interface IToolGrant {
  group: ToolGroup;
  roles: HarnessRole[];
}
