import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Button, Intern, Tag, Wordmark } from '@/shared/components/atoms';
import { SpeechBubble } from '@/shared/components/molecules';
import { MOTION } from '@/shared/constants';
import {
  StepAgents,
  StepDevices,
  StepDone,
  StepIntegrations,
  StepWelcome,
} from './components';
import { useOnboardingViewModel } from './hooks';
import './styles.css';

export const Onboarding: React.FC = () => {
  const {
    step,
    enterY,
    exitY,
    mood,
    say,
    isSaid,
    isFirst,
    isLast,
    nextLabel,
    dots,
    onSaid,
    onNext,
    onBack,
    onSkipAll,
    onFinish,
    onCreateProject,
  } = useOnboardingViewModel();
  const { t } = useTranslation();

  return (
    <section className="onboarding" data-theme="indigo">
      <div className="onboarding__brand">
        <span className="onboarding__wordmark">
          <Wordmark />
        </span>
        <Tag>{t('COMMON.BY_SALVE')}</Tag>
      </div>

      <AnimatePresence>
        {!isLast && (
          <motion.button
            key="skip"
            type="button"
            className="onboarding__skip"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: MOTION.durationFast, ease: MOTION.ease }}
            onClick={onSkipAll}
          >
            {t('SETUP.SKIP_SETUP')}
          </motion.button>
        )}
      </AnimatePresence>

      <div className="onboarding__stage">
        <motion.div
          layout="position"
          className="onboarding__speaker"
          transition={{ duration: MOTION.durationSlow, ease: MOTION.ease }}
        >
          <div className="onboarding__intern">
            <Intern mood={mood} size={136} isOnIndigo />
          </div>
          <SpeechBubble text={say} onSaid={onSaid} />
        </motion.div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            className="onboarding__content"
            initial={{ opacity: 0, y: enterY }}
            animate={isSaid ? { opacity: 1, y: 0 } : { opacity: 0, y: enterY }}
            exit={{ opacity: 0, y: exitY }}
            transition={{ duration: MOTION.duration, ease: MOTION.ease }}
          >
            {step === 'welcome' && <StepWelcome />}
            {step === 'agents' && <StepAgents />}
            {step === 'devices' && <StepDevices />}
            {step === 'integrations' && <StepIntegrations />}
            {step === 'done' && <StepDone />}
          </motion.div>
        </AnimatePresence>
      </div>

      <footer className="onboarding__footer">
        <div className="onboarding__back">
          <AnimatePresence>
            {!isFirst && (
              <motion.div
                key="back"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: MOTION.durationFast, ease: MOTION.ease }}
              >
                <Button variant="ghost" onClick={onBack}>
                  {t('SETUP.BACK')}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <ol className="onboarding__dots">
          {dots.map((dot) => (
            <li key={dot.id}>
              <button
                type="button"
                className={`onboarding__dot onboarding__dot--${dot.state}`}
                disabled={!dot.canVisit}
                aria-label={dot.label}
                aria-current={dot.ariaCurrent}
                onClick={dot.onVisit}
              />
            </li>
          ))}
        </ol>

        <div className="onboarding__next">
          {isLast ? (
            <>
              <Button onClick={onCreateProject}>{t('SETUP.CREATE_PROJECT')}</Button>
              <Button variant="primary" onClick={onFinish}>
                {t('SETUP.OPEN_APP')}
              </Button>
            </>
          ) : (
            <Button variant="primary" onClick={onNext}>
              {nextLabel}
            </Button>
          )}
        </div>
      </footer>
    </section>
  );
};
