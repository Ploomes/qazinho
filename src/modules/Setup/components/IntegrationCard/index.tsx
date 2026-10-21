import type { IIntegrationCardProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { GithubSignIn } from '@/modules/Setup/components/GithubSignIn';
import { InstallProgress } from '@/modules/Setup/components/InstallProgress';
import { Button, Icon, Input, StatusPill } from '@/shared/components/atoms';
import { MOTION } from '@/shared/constants';
import { useIntegrationCardViewModel } from './hooks';
import './styles.css';

export const IntegrationCard: React.FC<IIntegrationCardProps> = (props) => {
  const {
    isConnected,
    isOpen,
    hasAction,
    isActionBusy,
    isConnecting,
    error,
    text,
    needs,
    cliLine,
    pill,
    statusLabel,
    action,
    connectLabel,
    canConnect,
    tokenUrl,
    connectedNote,
    install,
    signIn,
    fields,
    rows,
    onAction,
    onInstall,
    onCancelSignIn,
    onCloseSignIn,
    onRetrySignIn,
    onCancel,
    onConnect,
  } = useIntegrationCardViewModel(props);
  const { t } = useTranslation();

  return (
    <div
      className={
        isConnected ? 'integration-card integration-card--on' : 'integration-card'
      }
    >
      <div className="integration-card__head">
        <span className="integration-card__logo">
          <img src={props.integration.logo} alt={props.integration.name} />
        </span>
        <span className="integration-card__text">
          <span className="integration-card__name">{props.integration.name}</span>
          <span className="integration-card__about">{text}</span>
        </span>
        <StatusPill status={pill} label={statusLabel} />
        <AnimatePresence initial={false}>
          {hasAction && (
            <motion.button
              key="action"
              type="button"
              className={
                isConnected
                  ? 'integration-card__action integration-card__action--quiet'
                  : 'integration-card__action'
              }
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: MOTION.durationFast, ease: MOTION.ease }}
              disabled={isActionBusy}
              onClick={() => {
                void onAction();
              }}
            >
              {isActionBusy && (
                <span className="integration-card__spinner" aria-hidden="true" />
              )}
              {action}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence initial={false} mode="wait">
        {isConnected && (
          <motion.div
            key="rows"
            className="integration-card__rows"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: MOTION.duration, ease: MOTION.ease }}
          >
            <div className="integration-card__grid">
              {rows.map((row) => (
                <div key={row.label} className="integration-card__row">
                  <span className="integration-card__key">{row.label}</span>
                  <span className="integration-card__value">{row.value}</span>
                </div>
              ))}
            </div>
            <p className="integration-card__hint">{connectedNote}</p>
          </motion.div>
        )}

        {isOpen && (
          <motion.div
            key="form"
            className="integration-card__form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: MOTION.duration, ease: MOTION.ease }}
          >
            <div className="integration-card__fields">
              <p className="integration-card__about">{needs}</p>

              {fields.map((field) => (
                <label key={field.id} className="integration-card__field">
                  <span className="integration-card__key">{field.label}</span>
                  <Input
                    value={field.value}
                    label={field.label}
                    placeholder={field.placeholder}
                    isMono
                    isSecret={field.isSecret}
                    onChange={field.onChange}
                  />
                </label>
              ))}

              <AnimatePresence>
                {error !== '' && (
                  <motion.p
                    key="error"
                    className="integration-card__error"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: MOTION.durationFast, ease: MOTION.ease }}
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <div className="integration-card__actions">
                <a
                  className="integration-card__link"
                  href={tokenUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t('SETUP.CREATE_TOKEN')} <Icon name="external" />
                </a>
                <Button variant="ghost" size="sm" onClick={onCancel}>
                  {t('COMMON.CANCEL')}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!canConnect}
                  onClick={() => {
                    void onConnect();
                  }}
                >
                  {isConnecting && (
                    <span className="integration-card__spinner" aria-hidden="true" />
                  )}
                  {connectLabel}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {!isConnected && !isOpen && (
          <motion.div
            key="needs"
            className="integration-card__needs"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: MOTION.duration, ease: MOTION.ease }}
          >
            <div className="integration-card__needs-body">
              <span className="integration-card__eyebrow">
                {t('SETUP.WHAT_IT_NEEDS')}
              </span>
              <p className="integration-card__about">{needs}</p>
              <AnimatePresence initial={false}>
                {cliLine !== null && (
                  <motion.div
                    key="cli"
                    className="integration-card__cli-fold"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: MOTION.duration, ease: MOTION.ease }}
                  >
                    <motion.p
                      key={cliLine}
                      className="integration-card__cli"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: MOTION.durationFast, ease: MOTION.ease }}
                    >
                      {cliLine}
                    </motion.p>
                  </motion.div>
                )}
                {error !== '' && (
                  <motion.div
                    key="error"
                    className="integration-card__cli-fold"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: MOTION.duration, ease: MOTION.ease }}
                  >
                    <p className="integration-card__error">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {install !== null && (
          <InstallProgress
            key="install"
            state={install}
            onRetry={() => {
              void onInstall();
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {signIn !== null && (
          <GithubSignIn
            key="github-sign-in"
            progress={signIn}
            onCancel={onCancelSignIn}
            onClose={onCloseSignIn}
            onRetry={onRetrySignIn}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
