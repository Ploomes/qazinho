import type { useMcpCardViewModel } from '@/modules/Setup/components/McpCard/hooks';
import type { IMcpServer } from '@/modules/Setup/types';

export interface IMcpControlProps {
  server: IMcpServer;
  view: ReturnType<typeof useMcpCardViewModel>;
}
