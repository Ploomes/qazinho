import type { IAskNoteProps } from './types';
import { Icon } from '@/shared/components/atoms';
import { useAskNoteViewModel } from './hooks';
import './styles.css';

/**
 * A question the run's agent asked the QA, in the run's section once it ended: what it
 * asked at which step, and the answer, or that none came.
 */
export const AskNote: React.FC<IAskNoteProps> = (props) => {
  const { label, where, question, isAnswered, isSecret, who, answer, className } =
    useAskNoteViewModel(props);

  return (
    <div className={className}>
      <span className="ask-note__head">
        <span className="ask-note__mark">
          <Icon name="ask" />
        </span>
        <span className="ask-note__label">{label}</span>
        <span className="ask-note__where">{where}</span>
      </span>
      <p className="ask-note__question">{question}</p>
      <p className="ask-note__answer">
        {isAnswered && <span className="ask-note__who">{who}</span>}
        {isSecret && (
          <span className="ask-note__lock">
            <Icon name="lock" />
          </span>
        )}
        <span className="ask-note__said">{answer}</span>
      </p>
    </div>
  );
};
