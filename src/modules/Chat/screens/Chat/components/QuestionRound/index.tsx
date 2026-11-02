import type { IQuestionRoundProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { Button, Caret, Icon, Input } from '@/shared/components/atoms';
import { useQuestionRoundViewModel } from './hooks';
import './styles.css';

/**
 * As perguntas do agente no chat, uma por vez: uma opção responde e segue, e "Outra" abre
 * um campo. Respondida, a rodada se dobra numa linha.
 */
export const QuestionRound: React.FC<IQuestionRoundProps> = (props) => {
  const view = useQuestionRoundViewModel(props);

  return (
    <section
      className={
        view.isAnswered ? 'question-round question-round--answered' : 'question-round'
      }
    >
      {view.isAnswered && (
        <button
          type="button"
          className="question-round__summary"
          aria-expanded={view.isExpanded}
          onClick={view.onToggle}
        >
          <span className="question-round__summary-mark">
            <Icon name="check" />
          </span>
          <span className="question-round__summary-text">{view.summary}</span>
          <span className="question-round__caret">
            <Caret isOpen={view.isExpanded} />
          </span>
        </button>
      )}

      <AnimatePresence initial={false}>
        {view.isBodyShown && (
          <motion.div
            key="body"
            className="question-round__fold"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={view.bodyTransition}
          >
            <div className="question-round__body">
              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  key={view.showingKey}
                  className="question-round__questions"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={view.swapTransition}
                >
                  {view.questions.map((question) => (
                    <div key={question.key} className="question-round__question">
                      {view.hasPosition && (
                        <span className="question-round__position">{view.position}</span>
                      )}
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
                            disabled={!view.isOpen}
                            title={option.tip}
                            className={
                              option.isPicked
                                ? 'question-round__option question-round__option--picked'
                                : 'question-round__option'
                            }
                            onClick={() => {
                              view.onPick({ index: question.index, label: option.label });
                            }}
                          >
                            <span className="question-round__label">{option.label}</span>
                            {option.hasLock && (
                              <span className="question-round__lock">
                                <Icon name="lock" />
                              </span>
                            )}
                            {option.isPicked && (
                              <span className="question-round__tick">
                                <Icon name="check" />
                              </span>
                            )}
                          </button>
                        ))}
                        {view.isOpen && (
                          <button
                            type="button"
                            aria-expanded={question.isOwnOpen}
                            className={
                              question.isOwnOpen
                                ? 'question-round__option question-round__option--picked'
                                : 'question-round__option'
                            }
                            onClick={() => {
                              view.onOwn(question.index);
                            }}
                          >
                            <span className="question-round__label">{view.ownLabel}</span>
                          </button>
                        )}
                      </div>

                      <AnimatePresence initial={false}>
                        {view.isOpen && question.isOwnOpen && (
                          <motion.div
                            key="own"
                            className="question-round__own"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={view.bodyTransition}
                          >
                            <div className="question-round__own-body">
                              <Input
                                isAutoFocused
                                value={question.text}
                                label={view.textLabel}
                                placeholder={view.textLabel}
                                onChange={(text) => {
                                  view.onText({ index: question.index, text });
                                }}
                                onKeyDown={view.onOwnKey}
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      {question.said !== '' && (
                        <p className="question-round__said">{question.said}</p>
                      )}
                    </div>
                  ))}
                </motion.div>
              </AnimatePresence>

              {view.hasFooter && (
                <div className="question-round__footer">
                  {view.canBack && (
                    <Button variant="ghost" onClick={view.onBack}>
                      {view.backLabel}
                    </Button>
                  )}
                  {view.hasNext && (
                    <Button
                      variant="primary"
                      disabled={!view.canNext}
                      onClick={view.onNext}
                    >
                      {view.nextLabel}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
