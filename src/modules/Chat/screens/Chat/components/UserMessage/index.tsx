import type { IUserMessageProps } from './types';
import { Markdown } from '@/shared/components/atoms';
import { useUserMessageViewModel } from './hooks';
import './styles.css';

/**
 * O que o QA mandou: o comando que deu, se algum, e as palavras dele com o que mencionou
 * em destaque.
 */
export const UserMessage: React.FC<IUserMessageProps> = (props) => {
  const { hasText, markdown, command, parts } = useUserMessageViewModel(props);

  return (
    <div className="user-message">
      {command !== null && (
        <span className="user-message__command">
          <span className="user-message__command-name">/ {command.name}</span>
          {command.parts.map((part) => (
            <span key={part.key} className={part.className}>
              {part.text}
            </span>
          ))}
        </span>
      )}
      {markdown !== null && (
        <div className="user-message__markdown">
          <Markdown>{markdown}</Markdown>
        </div>
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
