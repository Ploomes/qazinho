import { AnimatePresence, motion } from 'motion/react';
import { Button, Icon, Intern, Switch } from '@/shared/components/atoms';
import { MOTION } from '@/shared/constants';
import { OrgServerRow } from './components';
import { useOutsideServerCardViewModel } from './hooks';
import './styles.css';

/**
 * O QAzinho no agente de código do QA, um cartão só para os dois alcances: este
 * computador, ligado aqui e adicionado a cada agente, e as orgs da conta dele.
 */
export const OutsideServerCard: React.FC = () => {
  const {
    isOn,
    isLit,
    hasOrg,
    isBusy,
    internSize,
    name,
    hereTitle,
    switchLabel,
    isChecking,
    checkingText,
    hasNoAgents,
    noAgentsText,
    agents,
    hasAdded,
    newSessionNote,
    failure,
    copyLabel,
    copyIcon,
    copyNote,
    busyText,
    renewLabel,
    onToggle,
    onCopy,
    onRenew,
  } = useOutsideServerCardViewModel();

  return (
    <div className={isLit ? 'outside-card outside-card--on' : 'outside-card'}>
      <div className="outside-card__head">
        <span className="outside-card__logo">
          <Intern mood="neutral" size={internSize} isStill isFigure />
        </span>
        <span className="outside-card__text">
          <span className="outside-card__name">{name}</span>
        </span>
      </div>

      <div className="outside-card__reach">
        <div className="outside-card__reach-head">
          <span className="outside-card__text">
            <span className="outside-card__reach-name">{hereTitle}</span>
          </span>
          <Switch label={switchLabel} isOn={isOn} onChange={onToggle} />
        </div>

        <AnimatePresence initial={false}>
          {isOn && (
            <motion.div
              key="body"
              className="outside-card__fold"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: MOTION.duration, ease: MOTION.ease }}
            >
              <div className="outside-card__body">
                {isBusy && (
                  <div className="outside-card__busy">
                    <span className="outside-card__busy-text">
                      <Icon name="attention" /> {busyText}
                    </span>
                    <Button size="sm" onClick={onRenew}>
                      {renewLabel}
                    </Button>
                  </div>
                )}

                {isChecking && <p className="outside-card__note">{checkingText}</p>}
                {hasNoAgents && <p className="outside-card__note">{noAgentsText}</p>}

                {agents.map((agent) => (
                  <div key={agent.id} className="outside-card__agent">
                    <span className="outside-card__agent-name">{agent.name}</span>
                    {agent.isAdded && (
                      <span className="outside-card__added">
                        <Icon name="passed" /> {agent.addedText}
                      </span>
                    )}
                    <Button
                      size="sm"
                      variant={agent.isAdded ? 'ghost' : 'primary'}
                      disabled={agent.isDoing}
                      onClick={agent.onAction}
                    >
                      {agent.actionLabel}
                    </Button>
                  </div>
                ))}

                {hasAdded && <p className="outside-card__note">{newSessionNote}</p>}
                {failure !== null && <p className="outside-card__failure">{failure}</p>}

                <div className="outside-card__copy">
                  <Button size="sm" variant="secondary" onClick={onCopy}>
                    <Icon name={copyIcon} /> {copyLabel}
                  </Button>
                  <p className="outside-card__note">{copyNote}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence initial={false}>
        {hasOrg && (
          <motion.div
            key="org"
            className="outside-card__fold"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: MOTION.duration, ease: MOTION.ease }}
          >
            <OrgServerRow />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
