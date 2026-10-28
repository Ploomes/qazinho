import type { IAssistantAgentMessage } from './IAssistantAgentMessage';
import type { IAssistantConfirmMessage } from './IAssistantConfirmMessage';
import type { IAssistantErrorMessage } from './IAssistantErrorMessage';
import type { IAssistantNoteMessage } from './IAssistantNoteMessage';
import type { IAssistantToolMessage } from './IAssistantToolMessage';
import type { IAssistantUserMessage } from './IAssistantUserMessage';

/** Uma linha do chat do assistente. */
export type AssistantMessage =
  | IAssistantUserMessage
  | IAssistantAgentMessage
  | IAssistantToolMessage
  | IAssistantConfirmMessage
  | IAssistantErrorMessage
  | IAssistantNoteMessage;
