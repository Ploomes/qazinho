import type { IUserMessageProps } from './types';
import './styles.css';

export const UserMessage: React.FC<IUserMessageProps> = (props) => (
  <p className="user-message__text">{props.message.text}</p>
);
