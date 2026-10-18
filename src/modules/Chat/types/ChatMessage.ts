import type { IAgentMessage } from './IAgentMessage';
import type { IAskMessage } from './IAskMessage';
import type { IErrorMessage } from './IErrorMessage';
import type { INoteMessage } from './INoteMessage';
import type { IPlanMessage } from './IPlanMessage';
import type { IQuestionsMessage } from './IQuestionsMessage';
import type { IRunMessage } from './IRunMessage';
import type { IUserMessage } from './IUserMessage';
import type { IVerdictMessage } from './IVerdictMessage';

export type ChatMessage =
  | IUserMessage
  | IAgentMessage
  | INoteMessage
  | IPlanMessage
  | IRunMessage
  | IVerdictMessage
  | IAskMessage
  | IQuestionsMessage
  | IErrorMessage;
