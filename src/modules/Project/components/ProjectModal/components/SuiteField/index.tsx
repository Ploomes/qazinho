import type { ISuiteFieldProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { TargetCard } from '@/modules/Project/components/ProjectModal/components/TargetCard';
import { Button, Icon } from '@/shared/components/atoms';
import { MOTION } from '@/shared/constants';
import { useSuiteFieldViewModel } from './hooks';
import './styles.css';

/** The Playwright suite a project runs, from the folder where the QA keeps it cloned, with the settings its tests read and where each comes from. */
export const SuiteField: React.FC<ISuiteFieldProps> = (props) => {
  const {
    canConnect,
    isConnected,
    isPicking,
    hasRefused,
    connectLabel,
    laterText,
    refusedText,
    name,
    path,
    hasPackages,
    runner,
    packagesText,
    branch,
    repository,
    hasSettings,
    settingsTitle,
    settingsNote,
    settings,
    changeLabel,
    forgetLabel,
    onPick,
    onForget,
  } = useSuiteFieldViewModel(props);
  const { t } = useTranslation();

  return (
    <TargetCard
      name={t('AUTOMATION.TITLE')}
      text={t('AUTOMATION.CONNECT_TEXT')}
      lock={null}
      isStacked
    >
      <AnimatePresence mode="wait" initial={false}>
        {isConnected ? (
          <motion.div
            key="connected"
            className="suite-field"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: MOTION.duration, ease: MOTION.ease }}
          >
            <div className="suite-field__head">
              <span className="suite-field__icon">
                <Icon name="suite" />
              </span>
              <span className="suite-field__name">{name}</span>
              <span
                className={
                  hasPackages
                    ? 'suite-field__chip'
                    : 'suite-field__chip suite-field__chip--attn'
                }
              >
                {runner}
              </span>
              {branch !== null && (
                <span className="suite-field__chip">
                  <Icon name="branch" /> {branch}
                </span>
              )}
            </div>
            <span className="suite-field__path" title={path}>
              {repository ?? path}
            </span>

            {!hasPackages && <p className="suite-field__note">{packagesText}</p>}

            {hasSettings && (
              <div className="suite-field__settings">
                <span className="suite-field__settings-title">{settingsTitle}</span>
                <ul className="suite-field__list">
                  {settings.map((setting) => (
                    <li key={setting.key} className={setting.className}>
                      <span className="suite-field__key">{setting.key}</span>
                      <span className="suite-field__source">
                        <Icon name={setting.icon} /> {setting.word}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="suite-field__note">{settingsNote}</p>
              </div>
            )}

            <div className="suite-field__actions">
              <Button size="sm" disabled={isPicking} onClick={onPick}>
                <Icon name="folder" /> {changeLabel}
              </Button>
              <Button size="sm" variant="danger-quiet" onClick={onForget}>
                {forgetLabel}
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            className="suite-field suite-field--empty"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: MOTION.duration, ease: MOTION.ease }}
          >
            {canConnect ? (
              <Button size="sm" variant="primary" disabled={isPicking} onClick={onPick}>
                <Icon name="folder" /> {connectLabel}
              </Button>
            ) : (
              <p className="suite-field__note">{laterText}</p>
            )}
            <AnimatePresence initial={false}>
              {hasRefused && (
                <motion.p
                  key="refused"
                  className="suite-field__refused"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: MOTION.duration, ease: MOTION.ease }}
                >
                  <Icon name="attention" /> {refusedText}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </TargetCard>
  );
};
