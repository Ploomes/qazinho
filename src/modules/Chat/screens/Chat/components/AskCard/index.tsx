import type { IAskCardProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { Button, Chip, Eyebrow, Icon, Input, Switch } from '@/shared/components/atoms';
import { useAskCardViewModel } from './hooks';
import './styles.css';

/**
 * A pergunta que o agente de uma run espera, como cartão que o QA responde no chat: uma
 * das respostas, as próprias palavras, ou um segredo de que o agente só vê o nome.
 */
export const AskCard: React.FC<IAskCardProps> = (props) => {
  const {
    eyebrow,
    where,
    question,
    hasOptions,
    options,
    text,
    fieldLabel,
    isSecret,
    canMakeSecret,
    secretLabel,
    secretTip,
    secretNote,
    isKept,
    keepLabel,
    className,
    canSend,
    sendLabel,
    waiting,
    foldTransition,
    onText,
    onSecret,
    onKeep,
    onSend,
    onSubmit,
  } = useAskCardViewModel(props);

  return (
    <section className={className} aria-label={eyebrow}>
      <header className="ask-card__head">
        <span className="ask-card__mark">
          <Icon name="ask" />
        </span>
        <Eyebrow>{eyebrow}</Eyebrow>
        <span className="ask-card__where">{where}</span>
      </header>

      <p className="ask-card__question">{question}</p>

      {hasOptions && (
        <div className="ask-card__options" role="group" aria-label={question}>
          {options.map((option) => (
            <Chip key={option.label} onClick={option.onPick}>
              {option.label}
            </Chip>
          ))}
        </div>
      )}

      <form className="ask-card__form" onSubmit={onSubmit}>
        <div className="ask-card__field">
          <div className="ask-card__input">
            <Input
              value={text}
              label={fieldLabel}
              placeholder={fieldLabel}
              isSecret={isSecret}
              isAutoFocused
              onChange={onText}
            />
          </div>
          <Button variant="primary" disabled={!canSend} onClick={onSend}>
            {sendLabel}
          </Button>
        </div>

        <div className="ask-card__switches">
          {canMakeSecret && (
            <Switch
              label={secretLabel}
              title={secretTip}
              icon="lock"
              isOn={isSecret}
              onChange={onSecret}
            />
          )}
          <AnimatePresence initial={false}>
            {isSecret && (
              <motion.span
                key="keep"
                className="ask-card__keep"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={foldTransition}
              >
                <Switch label={keepLabel} isOn={isKept} onChange={onKeep} />
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence initial={false}>
          {isSecret && (
            <motion.div
              key="secret"
              className="ask-card__fold"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={foldTransition}
            >
              <p className="ask-card__secret">
                <span className="ask-card__lock">
                  <Icon name="lock" />
                </span>
                {secretNote}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      <span className="ask-card__waiting">{waiting}</span>
    </section>
  );
};
