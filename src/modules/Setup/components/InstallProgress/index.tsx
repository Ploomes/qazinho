import type { IInstallProgressProps } from './types';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/atoms';
import { MOTION } from '@/shared/constants';
import { useInstallProgressViewModel } from './hooks';
import './styles.css';

export const InstallProgress: React.FC<IInstallProgressProps> = (props) => {
  const { phase, segments, label, line, error, command, copyLabel, onCopy, onRetry } =
    useInstallProgressViewModel(props);
  const { t } = useTranslation();

  return (
    <motion.div
      className="install-progress"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: MOTION.duration, ease: MOTION.ease }}
    >
      <div className="install-progress__body">
        {phase === 'installing' && (
          <>
            <div className="install-progress__bar" role="progressbar" aria-label={label}>
              {segments.map((segment) => (
                <span
                  key={segment.key}
                  className={`install-progress__segment install-progress__segment--${segment.fill}`}
                />
              ))}
            </div>
            <div className="install-progress__meta">
              <span className="install-progress__label">{label}</span>
              <span className="install-progress__line">{line}</span>
            </div>
          </>
        )}

        {phase === 'installed' && (
          <span className="install-progress__done">
            <span aria-hidden="true">✓</span>
            {label}
          </span>
        )}

        {phase === 'failed' && (
          <>
            <p className="install-progress__error">{error}</p>
            <span className="install-progress__label">{t('SETUP.RUN_IT_YOURSELF')}</span>
            <div className="install-progress__command">
              <code className="install-progress__code">{command}</code>
              <button
                type="button"
                className="install-progress__copy"
                onClick={() => {
                  void onCopy();
                }}
              >
                {copyLabel}
              </button>
            </div>
            <div>
              <Button size="sm" onClick={onRetry}>
                {t('SETUP.TRY_AGAIN')}
              </Button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};
