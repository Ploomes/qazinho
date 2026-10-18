import type { IQuestionRoundProps } from './types';
import { Button, Eyebrow, Input } from '@/shared/components/atoms';
import { useQuestionRoundViewModel } from './hooks';
import './styles.css';

/** The agent's questions in the chat: the QA picks an option or writes an answer to each, and sends them together. */
export const QuestionRound: React.FC<IQuestionRoundProps> = (props) => {
  const {
    style,
    eyebrow,
    isAnswered,
    isOpen,
    canSend,
    sendLabel,
    textLabel,
    questions,
    onPick,
    onText,
    onSend,
  } = useQuestionRoundViewModel(props);

  return (
    <section
      className={
        isAnswered ? 'question-round question-round--answered' : 'question-round'
      }
      style={style}
    >
      <Eyebrow>{eyebrow}</Eyebrow>

      {questions.map((question) => (
        <div key={question.key} className="question-round__question">
          <span className="question-round__header">{question.header}</span>
          <p className="question-round__ask">{question.question}</p>
          {question.hint !== '' && (
            <span className="question-round__hint">{question.hint}</span>
          )}

          <div
            className="question-round__options"
            role={question.isMultiSelect ? 'group' : 'radiogroup'}
            aria-label={question.question}
          >
            {question.options.map((option) => (
              <button
                key={option.label}
                type="button"
                role={question.isMultiSelect ? 'checkbox' : 'radio'}
                aria-checked={option.isPicked}
                disabled={!isOpen}
                className={
                  option.isPicked
                    ? 'question-round__option question-round__option--picked'
                    : 'question-round__option'
                }
                onClick={() => {
                  onPick({ index: question.index, label: option.label });
                }}
              >
                <span
                  className={
                    question.isMultiSelect
                      ? 'question-round__mark question-round__mark--box'
                      : 'question-round__mark'
                  }
                  aria-hidden="true"
                >
                  {option.isPicked ? '✓' : ''}
                </span>
                <span className="question-round__choice">
                  <span className="question-round__label">{option.label}</span>
                  <span className="question-round__description">
                    {option.description}
                  </span>
                </span>
              </button>
            ))}
          </div>

          {isOpen && (
            <Input
              value={question.text}
              label={textLabel}
              placeholder={textLabel}
              onChange={(text) => {
                onText({ index: question.index, text });
              }}
            />
          )}
          {question.said !== '' && (
            <p className="question-round__said">{question.said}</p>
          )}
        </div>
      ))}

      {isOpen && (
        <div className="question-round__footer">
          <Button variant="primary" disabled={!canSend} onClick={onSend}>
            {sendLabel}
          </Button>
        </div>
      )}
    </section>
  );
};
