import type { IMcpServer } from '@/modules/Setup/types';
import figma from '@/modules/Setup/assets/figma.svg';
import qazinho from '@/modules/Setup/assets/qazinho.png';

export const MCP_SERVERS: IMcpServer[] = [
  {
    id: 'figma',
    name: 'Figma',
    logo: figma,
    textKey: 'MCP.FIGMA_TEXT',
    needsKey: 'MCP.FIGMA_NEEDS',
    needsAccount: false,
  },
  {
    id: 'org',
    name: 'QAzinho',
    logo: qazinho,
    textKey: 'MCP.ORG_TEXT',
    needsKey: 'MCP.ORG_NEEDS',
    needsAccount: true,
  },
];
