import type { IMcpServer } from '@/modules/Setup/types';
import figma from '@/modules/Setup/assets/figma.svg';

export const MCP_SERVERS: IMcpServer[] = [
  {
    id: 'figma',
    name: 'Figma',
    logo: figma,
    textKey: 'MCP.FIGMA_TEXT',
  },
];
