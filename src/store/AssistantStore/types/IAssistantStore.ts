import type {
  AssistantMessage,
  ConfirmDecision,
  IAssistantConfirmMessage,
  IAssistantTip,
  IAssistantToolMessage,
} from '@/modules/Assistant/types';

/**
 * O Estagiário no canto: se o chat dele está aberto, o que foi dito nele, e com o que ele
 * está ocupado.
 */
export interface IAssistantStore {
  isOpen: boolean;
  messages: AssistantMessage[];
  sessionId: string | null;
  sessionAgentId: string | null;
  isAsking: boolean;
  liveText: string;
  unread: number;
  tip: IAssistantTip | null;
  open: () => void;
  close: () => void;
  toggle: () => void;
  send: (text: string) => void;
  landAnswer: (props: {
    text: string;
    sessionId: string | null;
    agentId: string;
  }) => void;
  landError: (text: string) => void;
  landStopped: (text: string) => void;
  setLiveText: (text: string) => void;
  keepLiveText: () => void;
  startTool: (message: IAssistantToolMessage) => void;
  endTool: (props: { id: string; isError: boolean; buildId?: string }) => void;
  askConfirm: (message: IAssistantConfirmMessage) => void;
  settleConfirm: (props: { id: string; decision: ConfirmDecision }) => void;
  startOver: () => void;
  say: (text: string) => void;
  hush: () => void;
}
