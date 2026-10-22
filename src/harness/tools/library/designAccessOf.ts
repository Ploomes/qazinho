import type { IDesignAccess } from '@/harness/tools/types';
import type { IDesignLink } from '@/shared/types';
import { DESIGN_TOOLS } from '@/harness/tools/constants';
import { FIGMA_MCP } from '@/shared/constants';

/** The QA's Figma server and its reading tools when the workspace has a design, and nothing when it has none. */
export function designAccessOf(design: IDesignLink | null): IDesignAccess {
  return design === null
    ? { servers: [], allowedTools: [] }
    : {
        servers: [{ name: FIGMA_MCP.name, url: FIGMA_MCP.url }],
        allowedTools: DESIGN_TOOLS.map((tool) => `mcp__${FIGMA_MCP.name}__${tool}`),
      };
}
