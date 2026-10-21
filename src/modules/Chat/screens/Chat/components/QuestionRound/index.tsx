import type { IQuestionRoundProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { Button, Caret, Eyebrow, Icon, Input } from '@/shared/components/atoms';
import { MOTION } from '@/shared/constants';
import { useQuestionRoundViewModel } from './hooks';
import './styles.css';

/** The agent's questions in the chat: the QA picks an option or writes an answer to each, and sends them together. */
export const QuestionRound: React.FC<IQuestionRoundProps> = (props) => {
  const {
    style,
    eyebrow,
    summary,
    isAnswered,
    isExpanded,
    isBodyShown,
    bodyTransition,
    isOpen,
    canSend,
    sendLabel,
    textLabel,
    questions,
    onPick,
    onText,
    onSend,
    onToggle,
  } = useQuestionRoundViewModel(props);

  return (
    <section
      className={
        isAnswered ? 'question-round question-round--answered' : 'question-round'
      }
      style={style}
    >
      {isAnswered ? (
        <button
          type="button"
          className="question-round__summary"
          aria-expanded={isExpanded}
          onClick={onToggle}
        >
          <span className="question-round__summary-mark">
            <Icon name="check" />
          </span>
          <span className="question-round__summary-text">{summary}</span>
          <span className="question-round__caret">
            <Caret isOpen={isExpanded} />
          </span>
        </button>
      ) : (
        <Eyebrow>{eyebrow}</Eyebrow>
      )}

      <AnimatePresence initial={false}>
        {isBodyShown && (
          <motion.div
            key="body"
            className="question-round__fold"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={bodyTransition}
          >
            <div className="question-round__body">
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
                          <AnimatePresence initial={false}>
                            {option.isPicked && (
                              <motion.span
                                key="picked"
                                className="question-round__tick"
                                initial={{ opacity: 0, scale: 0.4 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.4 }}
                                transition={{
                                  duration: MOTION.durationFast,
                                  ease: MOTION.ease,
                                }}
                              >
                                <Icon name="check" />
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </span>
                        <span className="question-round__choice">
                          <span className="question-round__label">{option.label}</span>
                          <span className="question-round__description">
                            {option.description}
                          </span>
                          {option.secrets !== null && (
                            <span className={option.secrets.className}>
                              <span className="question-round__secrets-label">
                                <span className="question-round__lock">
                                  <Icon name="lock" />
                                </span>
                                {option.secrets.label}
                              </span>
                              <span className="question-round__secret-names">
                                {option.secrets.names.map((name) => (
                                  <span key={name} className="question-round__secret">
                                    {name}
                                  </span>
                                ))}
                              </span>
                            </span>
                          )}
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
