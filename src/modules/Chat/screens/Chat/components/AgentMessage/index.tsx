import type { IAgentMessageProps } from './types';
import { Markdown } from '@/shared/components/atoms';

/** O que o agente disse no chat, com o Markdown renderizado. */
export const AgentMessage: React.FC<IAgentMessageProps> = (props) => (
  <Markdown>{props.text}</Markdown>
);
