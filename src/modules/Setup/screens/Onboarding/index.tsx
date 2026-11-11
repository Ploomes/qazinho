import { AnimatePresence, motion } from 'motion/react';
import { Button, Intern } from '@/shared/components/atoms';
import { MOTION } from '@/shared/constants';
import { StepAgents, StepDevices, StepIntegrations, StepWelcome } from './components';
import { useOnboardingViewModel } from './hooks';
import './styles.css';

/**
 * A configuração da primeira execução, uma pergunta por passo: o idioma, o agente, o
 * celular e os trackers, no mesmo jeito da pergunta pelo primeiro app.
 */
export const Onboarding: React.FC = () => {
  const {
    step,
    style,
    internSize,
    enterY,
    exitY,
    mood,
    title,
    lead,
    isFirst,
    nextLabel,
    skipLabel,
    backLabel,
    onNext,
    onBack,
    onSkipAll,
  } = useOnboardingViewModel();

  return (
    <section className="onboarding" style={style}>
      <button type="button" className="onboarding__skip" onClick={onSkipAll}>
        {skipLabel}
      </button>

      <div className="onboarding__column">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            className="onboarding__step"
            initial={{ opacity: 0, y: enterY }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: exitY }}
            transition={{ duration: MOTION.duration, ease: MOTION.ease }}
          >
            <Intern mood={mood} size={internSize} />
            <h1 className="onboarding__title">{title}</h1>
            <p className="onboarding__lead">{lead}</p>

            <div className="onboarding__content">
              {step === 'welcome' && <StepWelcome />}
              {step === 'agents' && <StepAgents />}
              {step === 'devices' && <StepDevices />}
              {step === 'integrations' && <StepIntegrations />}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="onboarding__actions">
          <Button variant="primary" onClick={onNext}>
            {nextLabel}
          </Button>
          {!isFirst && (
            <button type="button" className="onboarding__back" onClick={onBack}>
              {backLabel}
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
