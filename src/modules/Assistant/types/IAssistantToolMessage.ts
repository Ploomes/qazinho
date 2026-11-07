import type { AssistantConfirmAction } from './AssistantConfirmAction';
import type { ToolState } from './ToolState';
import type { AppToolCall } from '@/shared/types';

/**
 * Uma ferramenta que o assistente usou, como uma linha no chat dele: a chamada, o que ela
 * tocou em palavras, como foi, e o build que iniciou.
 */
export interface IAssistantToolMessage {
  kind: 'tool';
  id: string;
  call: Exclude<AppToolCall, { name: AssistantConfirmAction }>;
  subject: string;
  state: ToolState;
  buildId?: string;
}
