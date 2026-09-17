import type { IUserMessageProps } from './types';
import { useUserMessageViewModel } from './hooks';
import './styles.css';

export const UserMessage: React.FC<IUserMessageProps> = (props) => {
  const { parts } = useUserMessageViewModel(props);

  return (
    <p className="user-message__text">
      {parts.map((part) =>
        part.isMention ? (
          <span key={part.key} className="user-message__mention">
            {part.text}
          </span>
        ) : (
          part.text
        ),
      )}
    </p>
  );
};
