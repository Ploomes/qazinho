import type { IUserMessageProps } from './types';
import { Icon, Markdown } from '@/shared/components/atoms';
import { useUserMessageViewModel } from './hooks';
import './styles.css';

/**
 * O que o QA mandou: o comando que deu, se algum, e as palavras dele com o que mencionou
 * em destaque.
 */
export const UserMessage: React.FC<IUserMessageProps> = (props) => {
  const { hasText, markdown, attachments, command, parts } =
    useUserMessageViewModel(props);

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
      {attachments.length > 0 && (
        <div className="user-message__attachments">
          {attachments.map((one) =>
            one.preview === null ? (
              <span key={one.key} className="user-message__file" title={one.name}>
                <Icon name="file" />
                <span className="user-message__file-name">{one.name}</span>
              </span>
            ) : (
              <img
                key={one.key}
                className="user-message__image"
                src={one.preview}
                alt={one.name}
                title={one.name}
              />
            ),
          )}
        </div>
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
