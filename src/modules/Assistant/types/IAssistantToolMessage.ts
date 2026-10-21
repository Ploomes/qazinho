import type { ConfirmAction } from './ConfirmAction';
import type { ToolState } from './ToolState';
import type { AppToolCall } from '@/shared/types';

/** A tool the assistant used, as a line in its chat: the call, what it touched in words, and how it went. */
export interface IAssistantToolMessage {
  kind: 'tool';
  id: string;
  call: Exclude<AppToolCall, { name: ConfirmAction }>;
  subject: string;
  state: ToolState;
}
