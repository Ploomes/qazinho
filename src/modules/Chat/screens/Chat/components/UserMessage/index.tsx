import type { IUserMessageProps } from './types';
import { useUserMessageViewModel } from './hooks';
import './styles.css';

/** What the QA sent: the command they gave, if any, and their words with what they mentioned standing out. */
export const UserMessage: React.FC<IUserMessageProps> = (props) => {
  const { hasText, command, parts } = useUserMessageViewModel(props);

  return (
    <div className="user-message">
      {command !== null && (
        <span className="user-message__command">
          <span className="user-message__command-name">/ {command.name}</span>
          <span className="user-message__command-part">{command.repository}</span>
          <span className="user-message__command-part user-message__command-part--branch">
            {command.branch}
          </span>
        </span>
      )}
      {hasText && (
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
      )}
    </div>
  );
};
