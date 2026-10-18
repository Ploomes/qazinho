import type { AgentSignInProgress } from '@/shared/types';

export interface IAgentSignInProps {
  agent: string;
  progress: AgentSignInProgress;
  onCancel: () => void;
  onClose: () => void;
  onRetry: () => void;
  onCode: (code: string) => void;
}
