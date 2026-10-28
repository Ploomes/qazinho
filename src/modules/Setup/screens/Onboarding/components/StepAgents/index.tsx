import { AnimatePresence, motion } from 'motion/react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { AgentSignIn, InstallProgress, ToolCard } from '@/modules/Setup/components';
import { Button, Icon } from '@/shared/components/atoms';
import { MOTION } from '@/shared/constants';
import { useStepAgentsViewModel } from './hooks';
import './styles.css';

export const StepAgents: React.FC = () => {
  const {
    isChecking,
    needsNpm,
    nodeUrl,
    hasAgent,
    rows,
    signIn,
    signInAgent,
    onCheckAgain,
    onCancelSignIn,
    onCloseSignIn,
    onRetrySignIn,
    onSignInCode,
  } = useStepAgentsViewModel();
  const { t } = useTranslation();

  return (
    <div className="step-agents">
      <div
        className="step-agents__list"
        role="radiogroup"
        aria-label={t('SETUP.STEP_AGENTS')}
      >
        {rows.map((row) => (
          <ToolCard
            key={row.id}
            name={row.name}
            about={row.about}
            detail={row.detail}
            state={row.state}
            badge={row.badge}
            isSelected={row.isInUse}
            onSelect={row.onUse}
            action={
              row.canSignIn ? (
                <Button size="sm" variant="primary" onClick={row.onSignIn}>
                  {t('SETUP.SIGN_IN')}
                </Button>
              ) : row.canInstall ? (
                <Button size="sm" variant="primary" onClick={row.onInstall}>
                  {t('SETUP.INSTALL')}
                </Button>
              ) : undefined
            }
          >
            <AnimatePresence initial={false}>
              {row.install !== null && row.install.phase !== 'installed' && (
                <InstallProgress
                  key="install"
                  state={row.install}
                  onRetry={row.onInstall}
                />
              )}
              {row.signIn !== '' && (
                <motion.div
                  key="sign-in"
                  className="step-agents__sign-in"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: MOTION.duration, ease: MOTION.ease }}
                >
                  <p className="step-agents__sign-in-text">{row.signIn}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </ToolCard>
        ))}
      </div>

      <AnimatePresence initial={false}>
        {needsNpm && (
          <motion.p
            key="npm"
            className="step-agents__note step-agents__note--attn"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: MOTION.durationFast, ease: MOTION.ease }}
          >
            {t('SETUP.NEEDS_NPM')}{' '}
            <a
              className="step-agents__link"
              href={nodeUrl}
              target="_blank"
              rel="noreferrer"
            >
              nodejs.org <Icon name="external" />
            </a>
          </motion.p>
        )}
        {!hasAgent && (
          <motion.p
            key="none"
            className="step-agents__note"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: MOTION.durationFast, ease: MOTION.ease }}
          >
            {t('SETUP.NO_AGENT')}
          </motion.p>
        )}
      </AnimatePresence>

      {createPortal(
        <AnimatePresence>
          {signIn !== null && (
            <AgentSignIn
              key="sign-in"
              agent={signInAgent}
              progress={signIn}
              onCancel={onCancelSignIn}
              onClose={onCloseSignIn}
              onRetry={onRetrySignIn}
              onCode={onSignInCode}
            />
          )}
        </AnimatePresence>,
        document.body,
      )}

      <div className="step-agents__recheck">
        <Button size="sm" variant="ghost" disabled={isChecking} onClick={onCheckAgain}>
          {isChecking ? t('SETUP.CHECKING') : t('SETUP.CHECK_AGAIN')}
        </Button>
      </div>
    </div>
  );
};
