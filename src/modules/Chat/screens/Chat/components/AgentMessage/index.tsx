import type { IAgentMessageProps } from './types';
import './styles.css';

export const AgentMessage: React.FC<IAgentMessageProps> = (props) => (
  <p className="agent-message__text">{props.message.text}</p>
);
