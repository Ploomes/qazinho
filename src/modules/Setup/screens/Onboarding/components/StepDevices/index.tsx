import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/atoms';
import { MOTION } from '@/constants';
import { InstallProgress } from '@/modules/Setup/components';
import { ToolCard } from '@/modules/Setup/screens/Onboarding/components/ToolCard';
import { useStepDevicesViewModel } from './hooks';
import './styles.css';

export const StepDevices: React.FC = () => {
  const {
    isMac,
    isChecking,
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
      <ToolCard
        name="Android SDK"
        about={t('SETUP.ANDROID_ABOUT')}
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
              {t('SETUP.GET_ANDROID_STUDIO')}
            </a>
          )
        }
      />

      <span className="step-devices__group">iOS</span>
      <ToolCard
        name="Xcode"
        about={t('SETUP.XCODE_ABOUT')}
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
              {t('SETUP.GET_XCODE')}
            </a>
          )
        }
      />
      <ToolCard
        name="idb"
        about={t('SETUP.IDB_ABOUT')}
        detail={idb.detail}
        state={idb.state}
        badge={idb.badge}
        action={
          idb.canInstall && (
            <Button size="sm" variant="primary" onClick={onInstallIdb}>
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
              brew.sh ↗
            </a>
          </motion.p>
        )}
      </AnimatePresence>

      <p className="step-devices__note">
        {isMac ? t('SETUP.DEVICES_NOTE') : t('SETUP.IOS_OFF_NOTE')}
      </p>

      <div className="step-devices__recheck">
        <Button size="sm" variant="ghost" disabled={isChecking} onClick={onCheckAgain}>
          {isChecking ? t('SETUP.CHECKING') : t('SETUP.CHECK_AGAIN')}
        </Button>
      </div>
    </div>
  );
};
