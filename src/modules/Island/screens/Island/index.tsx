import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { Button, Icon, Intern } from '@/shared/components/atoms';
import { MOTION } from '@/shared/constants';
import { useIslandViewModel } from './hooks';
import './styles.css';

/**
 * A ilha do notch: um pill preto colado no topo da tela que mostra o que a run faz nas
 * orelhas ao lado do notch, e abre abaixo dele quando o mouse chega.
 */
export const Island: React.FC = () => {
  const {
    shown,
    isOpen,
    pill,
    pillClassName,
    flash,
    style,
    size,
    internSize,
    onOpen,
    onStop,
  } = useIslandViewModel();

  return (
    <MotionConfig reducedMotion="user">
      <div className="island" style={style}>
        {shown !== null && (
          <motion.div
            ref={pill}
            className={pillClassName}
            initial={false}
            animate={size}
            transition={{ duration: MOTION.duration, ease: MOTION.ease }}
          >
            {flash > 0 && <span key={flash} className="island__flash" />}
            <div className="island__bar">
              <span className="island__left">
                <Intern mood={shown.mood} size={internSize} isFigure />
              </span>
              <span className="island__notch" />
              <span className="island__right">
                <span className="island__count">{shown.count}</span>
                <span className={`island__icon island__icon--${shown.tone}`}>
                  <Icon name={shown.icon} size={14} />
                </span>
              </span>
            </div>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="body"
                  className="island__body"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: MOTION.durationFast, ease: MOTION.ease }}
                >
                  <span className="island__title">{shown.title}</span>
                  <span className={`island__line island__line--${shown.tone}`}>
                    {shown.line}
                  </span>
                  {shown.detail !== '' && (
                    <span className="island__detail">{shown.detail}</span>
                  )}
                  {shown.progress !== null && (
                    <span className="island__track">
                      <span
                        className="island__fill"
                        style={{ width: `${String(shown.progress * 100)}%` }}
                      />
                    </span>
                  )}
                  <div className="island__actions">
                    <Button size="sm" variant="primary" onClick={onOpen}>
                      {shown.openLabel}
                    </Button>
                    {shown.canStop && (
                      <Button size="sm" variant="danger-quiet" onClick={onStop}>
                        <Icon name="stop" /> {shown.stopLabel}
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </MotionConfig>
  );
};
