import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { InstallProgress, ToolCard } from '@/modules/Setup/components';
import { Button, Icon } from '@/shared/components/atoms';
import { MOTION } from '@/shared/constants';
import { useStepDevicesViewModel } from './hooks';
import './styles.css';

export const StepDevices: React.FC = () => {
  const {
    isChecking,
    hasNote,
    note,
    canCheckAgain,
    needsBrew,
    brewUrl,
    android,
    xcode,
    idb,
    onInstallIdb,
    onCheckAgain,
  } = useStepDevicesViewModel();
  const { t } = useTranslation();

  return (
    <div className="step-devices">
      <span className="step-devices__group">Android</span>
      <div className="step-devices__list">
        <ToolCard
          name="Android SDK"
          detail={android.detail}
          state={android.state}
          badge={android.badge}
          action={
            android.link !== null && (
              <a
                className="step-devices__get"
                href={android.link}
                target="_blank"
                rel="noreferrer"
              >
                {t('SETUP.GET_ANDROID_STUDIO')} <Icon name="external" />
              </a>
            )
          }
        />
      </div>

      <span className="step-devices__group">iOS</span>
      <div className="step-devices__list">
        <ToolCard
          name="Xcode"
          detail={xcode.detail}
          state={xcode.state}
          badge={xcode.badge}
          action={
            xcode.link !== null && (
              <a
                className="step-devices__get"
                href={xcode.link}
                target="_blank"
                rel="noreferrer"
              >
                {t('SETUP.GET_XCODE')} <Icon name="external" />
              </a>
            )
          }
        />
        <ToolCard
          name="idb"
          detail={idb.detail}
          state={idb.state}
          badge={idb.badge}
          action={
            idb.canInstall && (
              <Button size="sm" onClick={onInstallIdb}>
                {t('SETUP.INSTALL')}
              </Button>
            )
          }
        >
          <AnimatePresence initial={false}>
            {idb.install !== null && (
              <InstallProgress key="install" state={idb.install} onRetry={onInstallIdb} />
            )}
          </AnimatePresence>
        </ToolCard>
      </div>

      <AnimatePresence initial={false}>
        {needsBrew && (
          <motion.p
            key="brew"
            className="step-devices__note step-devices__note--attn"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: MOTION.durationFast, ease: MOTION.ease }}
          >
            {t('SETUP.NEEDS_BREW')}{' '}
            <a
              className="step-devices__get"
              href={brewUrl}
              target="_blank"
              rel="noreferrer"
            >
              brew.sh <Icon name="external" />
            </a>
          </motion.p>
        )}
      </AnimatePresence>

      {hasNote && <p className="step-devices__note">{note}</p>}

      {canCheckAgain && (
        <button
          type="button"
          className="step-devices__recheck"
          disabled={isChecking}
          onClick={onCheckAgain}
        >
          {isChecking ? t('SETUP.CHECKING') : t('SETUP.CHECK_AGAIN')}
        </button>
      )}
    </div>
  );
};
