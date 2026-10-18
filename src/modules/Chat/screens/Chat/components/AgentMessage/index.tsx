import type { IAgentMessageProps } from './types';
import { Markdown } from '@/shared/components/atoms';

/** What the agent said in the chat, its Markdown rendered. */
export const AgentMessage: React.FC<IAgentMessageProps> = (props) => (
  <Markdown>{props.message.text}</Markdown>
);
