import type { IAssistantAgentMessage } from './IAssistantAgentMessage';
import type { IAssistantConfirmMessage } from './IAssistantConfirmMessage';
import type { IAssistantErrorMessage } from './IAssistantErrorMessage';
import type { IAssistantNoteMessage } from './IAssistantNoteMessage';
import type { IAssistantToolMessage } from './IAssistantToolMessage';
import type { IAssistantUserMessage } from './IAssistantUserMessage';

/** One line of the assistant's chat. */
export type AssistantMessage =
  | IAssistantUserMessage
  | IAssistantAgentMessage
  | IAssistantToolMessage
  | IAssistantConfirmMessage
  | IAssistantErrorMessage
  | IAssistantNoteMessage;
