import type {
  AssistantMessage,
  ConfirmDecision,
  IAssistantConfirmMessage,
  IAssistantToolMessage,
} from '@/modules/Assistant/types';

/** The Estagiário in the corner: whether its chat is open, what was said in it, and what it is busy with. */
export interface IAssistantStore {
  isOpen: boolean;
  messages: AssistantMessage[];
  sessionId: string | null;
  sessionAgentId: string | null;
  isAsking: boolean;
  liveText: string;
  unread: number;
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
  endTool: (props: { id: string; isError: boolean }) => void;
  askConfirm: (message: IAssistantConfirmMessage) => void;
  settleConfirm: (props: { id: string; decision: ConfirmDecision }) => void;
  startOver: () => void;
}
