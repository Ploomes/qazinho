import type { IActionMessage } from './IActionMessage';
import type { IAgentMessage } from './IAgentMessage';
import type { IAskMessage } from './IAskMessage';
import type { IErrorMessage } from './IErrorMessage';
import type { IPlanMessage } from './IPlanMessage';
import type { IRunMessage } from './IRunMessage';
import type { IUserMessage } from './IUserMessage';
import type { IVerdictMessage } from './IVerdictMessage';

export type ChatMessage =
  | IUserMessage
  | IAgentMessage
  | IActionMessage
  | IPlanMessage
  | IRunMessage
  | IVerdictMessage
  | IAskMessage
  | IErrorMessage;
