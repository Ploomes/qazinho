import type { IAgentMessage } from './IAgentMessage';
import type { IAskMessage } from './IAskMessage';
import type { IErrorMessage } from './IErrorMessage';
import type { IFindingMessage } from './IFindingMessage';
import type { IMemoryMessage } from './IMemoryMessage';
import type { INoteMessage } from './INoteMessage';
import type { IPlanMessage } from './IPlanMessage';
import type { IQuestionsMessage } from './IQuestionsMessage';
import type { IRunMessage } from './IRunMessage';
import type { ISkillsMessage } from './ISkillsMessage';
import type { ISuggestionMessage } from './ISuggestionMessage';
import type { IUserMessage } from './IUserMessage';
import type { IVerdictMessage } from './IVerdictMessage';

export type ChatMessage =
  | IUserMessage
  | IAgentMessage
  | INoteMessage
  | IFindingMessage
  | IPlanMessage
  | IRunMessage
  | IVerdictMessage
  | IAskMessage
  | ISuggestionMessage
  | IQuestionsMessage
  | IMemoryMessage
  | ISkillsMessage
  | IErrorMessage;
