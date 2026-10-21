import type { ITargetCardProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { LOCK_ICON } from '@/modules/Project/constants';
import { Button, PlatformIcon } from '@/shared/components/atoms';
import { MOTION } from '@/shared/constants';
import { useTargetCardViewModel } from './hooks';
import './styles.css';

/** A part of a project, a platform it targets or the code it is made of; one this machine cannot reach yet sits blurred behind how to set it up. */
export const TargetCard: React.FC<ITargetCardProps> = (props) => {
  const {
    isLocked,
    className,
    bodyClassName,
    isGuiding,
    guide,
    checkLabel,
    isChecking,
    onSetUp,
    onBack,
    onCheckAgain,
  } = useTargetCardViewModel(props);
  const { t } = useTranslation();

  return (
    <motion.div
      layout
      className={className}
      transition={{ layout: { duration: MOTION.duration, ease: MOTION.ease } }}
    >
      <motion.div
        className={bodyClassName}
        initial={false}
        animate={
          isLocked
            ? { filter: 'blur(3px)', opacity: 0.4, scale: 0.985 }
            : { filter: 'blur(0px)', opacity: 1, scale: 1 }
        }
        transition={{ duration: MOTION.durationSlow, ease: MOTION.ease }}
        aria-hidden={isLocked}
        inert={isLocked}
      >
        <div className="target-card__head">
          {props.platform !== undefined && (
            <span className="target-card__logo">
              <PlatformIcon kind={props.platform} size={16} />
            </span>
          )}
          <div className="target-card__words">
            <span className="target-card__name">{props.name}</span>
            <p className="target-card__text">{props.text}</p>
          </div>
        </div>
        <div className="target-card__field">{props.children}</div>
      </motion.div>

      <AnimatePresence initial={false}>
        {props.lock !== null && (
          <motion.div
            key="lock"
            className="target-card__veil"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: MOTION.duration, ease: MOTION.ease }}
          >
            <motion.div
              layout
              className="target-card__lock"
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.98 }}
              transition={{ duration: MOTION.duration, ease: MOTION.ease }}
            >
              <AnimatePresence initial={false} mode="popLayout">
                {isGuiding && guide !== null ? (
                  <motion.div
                    key="guide"
                    className="target-card__guide"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: MOTION.duration, ease: MOTION.ease }}
                  >
                    <p className="target-card__guide-text">{guide.guide}</p>
                    <div className="target-card__guide-actions">
                      <a
                        className="target-card__link"
                        href={guide.link.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {guide.link.label}
                      </a>
                      <Button size="sm" variant="ghost" onClick={onBack}>
                        {t('SETUP.BACK')}
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={isChecking}
                        onClick={onCheckAgain}
                      >
                        {checkLabel}
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="reason"
                    className="target-card__reason"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: MOTION.duration, ease: MOTION.ease }}
                  >
                    <svg
                      className="target-card__icon"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {LOCK_ICON.map((path) => (
                        <path key={path} d={path} />
                      ))}
                    </svg>
                    <span className="target-card__reason-text">{props.lock.reason}</span>
                    {props.lock.setUp !== null && (
                      <Button size="sm" variant="primary" onClick={onSetUp}>
                        {props.lock.setUp.label}
                      </Button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
