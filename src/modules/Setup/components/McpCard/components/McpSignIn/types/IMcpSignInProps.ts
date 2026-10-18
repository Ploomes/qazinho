import type { IMcpServer } from '@/modules/Setup/types';
import type { McpSignInProgress } from '@/shared/types';

export interface IMcpSignInProps {
  server: IMcpServer;
  agent: string;
  progress: McpSignInProgress;
  onCancel: () => void;
  onClose: () => void;
  onRetry: () => void;
  onUseTerminal: () => void;
}
