import type { IBugFlashProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { Icon, Intern } from '@/shared/components/atoms';
import { BUG_FLASH_CORNERS, BUG_FLASH_MOTION } from './constants';
import { useBugFlashViewModel } from './hooks';
import './styles.css';

/**
 * A tela pisca como uma foto, e o bug recém-pego fica uns segundos no meio dela: a imagem
 * chega perto do que está errado, a mira trava ali, e a legenda diz o que é.
 */
export const BugFlash: React.FC<IBugFlashProps> = (props) => {
  const {
    flash,
    style,
    eyebrow,
    headline,
    detail,
    photoAlt,
    hasFocus,
    imageClassName,
    miraClassName,
    shutterClassName,
    onHoldStart,
    onHoldEnd,
    onOpen,
  } = useBugFlashViewModel(props);

  return (
    <AnimatePresence mode="wait">
      {flash !== null && (
        <motion.div
          key={flash.id}
          className="bug-flash"
          role="status"
          style={style}
          initial="in"
          animate="shown"
          exit="out"
        >
          <motion.span
            className="bug-flash__veil"
            variants={BUG_FLASH_MOTION.veil}
            aria-hidden="true"
          />
          <motion.button
            type="button"
            className="bug-flash__stack"
            title={flash.title}
            variants={BUG_FLASH_MOTION.stack}
            onHoverStart={onHoldStart}
            onHoverEnd={onHoldEnd}
            onClick={onOpen}
          >
            <span className="bug-flash__photo">
              <span className="bug-flash__lens">
                {flash.shot !== null && (
                  <img className={imageClassName} src={flash.shot} alt={photoAlt} />
                )}
                {hasFocus && <i className="bug-flash__spot" aria-hidden="true" />}
              </span>
              <span className={miraClassName}>
                {BUG_FLASH_CORNERS.map((corner) => (
                  <motion.i
                    key={corner.key}
                    className={`bug-flash__corner bug-flash__corner--${corner.key}`}
                    custom={corner}
                    variants={BUG_FLASH_MOTION.corner}
                    aria-hidden="true"
                  />
                ))}
              </span>
            </span>
            <motion.span
              className="bug-flash__caption"
              variants={BUG_FLASH_MOTION.caption}
            >
              <span className="bug-flash__intern">
                <Intern mood="bug" size={44} />
              </span>
              <span className="bug-flash__words">
                <span className="bug-flash__eyebrow">
                  <Icon name="bug" />
                  {eyebrow}
                </span>
                <span className="bug-flash__headline">{headline}</span>
                {detail !== null && <span className="bug-flash__detail">{detail}</span>}
              </span>
            </motion.span>
          </motion.button>
          <span className={shutterClassName} aria-hidden="true" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
