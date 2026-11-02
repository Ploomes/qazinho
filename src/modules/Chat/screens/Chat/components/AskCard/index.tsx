import type { IAskCardProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { Button, Icon, IconButton, Input, Switch } from '@/shared/components/atoms';
import { Tooltip } from '@/shared/components/molecules';
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
    secretTip,
    isKept,
    keepLabel,
    className,
    canSend,
    sendLabel,
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
        <span className="ask-card__where">{where}</span>
      </header>

      <p className="ask-card__question">{question}</p>

      {hasOptions && (
        <div className="ask-card__options" role="group" aria-label={question}>
          {options.map((option) => (
            <button
              key={option.label}
              type="button"
              className="ask-card__option"
              onClick={option.onPick}
            >
              {option.label}
            </button>
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
          {canMakeSecret && (
            <Tooltip content={secretTip}>
              <IconButton
                icon="lock"
                label={secretTip}
                isActive={isSecret}
                onClick={onSecret}
              />
            </Tooltip>
          )}
          <Button variant="primary" disabled={!canSend} onClick={onSend}>
            {sendLabel}
          </Button>
        </div>

        <AnimatePresence initial={false}>
          {isSecret && (
            <motion.div
              key="keep"
              className="ask-card__keep"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={foldTransition}
            >
              <div className="ask-card__keep-body">
                <Switch label={keepLabel} isOn={isKept} onChange={onKeep} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </section>
  );
};
