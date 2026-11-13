import { AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { InstallProgress, ToolCard } from '@/modules/Setup/components';
import { Button, Icon } from '@/shared/components/atoms';
import { useStepDevicesViewModel } from './hooks';
import './styles.css';

export const StepDevices: React.FC = () => {
  const {
    isChecking,
    hasNote,
    note,
    canCheckAgain,
    android,
    xcode,
    axe,
    onInstallAxe,
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
          name="AXe"
          detail={axe.detail}
          state={axe.state}
          badge={axe.badge}
          action={
            axe.canInstall && (
              <Button size="sm" onClick={onInstallAxe}>
                {t('SETUP.INSTALL')}
              </Button>
            )
          }
        >
          <AnimatePresence initial={false}>
            {axe.install !== null && (
              <InstallProgress key="install" state={axe.install} onRetry={onInstallAxe} />
            )}
          </AnimatePresence>
        </ToolCard>
      </div>

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
