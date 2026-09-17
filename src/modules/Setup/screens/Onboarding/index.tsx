import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Button, Logo } from '@/components/atoms';
import { MOTION } from '@/constants';
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
    enterX,
    exitX,
    eyebrow,
    title,
    body,
    progress,
    progressLabel,
    isFirst,
    isLast,
    nextLabel,
    rail,
    onNext,
    onBack,
    onSkipAll,
    onFinish,
    onCreateProject,
  } = useOnboardingViewModel();
  const { t } = useTranslation();

  return (
    <section className="onboarding">
      <nav className="onboarding__rail">
        <div className="onboarding__brand">
          <Logo size={22} />
          <span className="onboarding__brand-name">{t('SETUP.RAIL_TITLE')}</span>
        </div>

        <ol className="onboarding__steps">
          {rail.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={`onboarding__step onboarding__step--${item.state}`}
                disabled={!item.canVisit}
                aria-current={item.ariaCurrent}
                onClick={item.onVisit}
              >
                <span className="onboarding__step-number">{item.mark}</span>
                {item.label}
              </button>
            </li>
          ))}
        </ol>

        <div className="onboarding__rail-foot">
          <div
            className="onboarding__progress"
            role="progressbar"
            aria-label={progressLabel}
          >
            <motion.span
              className="onboarding__progress-fill"
              animate={{ width: progress }}
              transition={{ duration: MOTION.durationSlow, ease: MOTION.ease }}
            />
          </div>
          <span className="onboarding__progress-label">{progressLabel}</span>
          {!isLast && (
            <button type="button" className="onboarding__skip" onClick={onSkipAll}>
              {t('SETUP.SKIP_SETUP')}
            </button>
          )}
        </div>
      </nav>

      <div className="onboarding__content">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            className="onboarding__page"
            initial={{ opacity: 0, x: enterX }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: exitX }}
            transition={{ duration: MOTION.duration, ease: MOTION.ease }}
          >
            <header className="onboarding__head">
              <span className="onboarding__eyebrow">{eyebrow}</span>
              <h1 className="onboarding__title">{title}</h1>
              <p className="onboarding__body">{body}</p>
            </header>

            {step === 'welcome' && <StepWelcome />}
            {step === 'agents' && <StepAgents />}
            {step === 'devices' && <StepDevices />}
            {step === 'integrations' && <StepIntegrations />}
            {step === 'done' && <StepDone />}

            <footer className="onboarding__footer">
              {!isFirst && (
                <Button variant="ghost" onClick={onBack}>
                  {t('SETUP.BACK')}
                </Button>
              )}
              <span className="onboarding__spacer" />
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
            </footer>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};
