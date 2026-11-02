import { AnimatePresence, motion } from 'motion/react';
import { AssistantTip } from '@/modules/Assistant/components/AssistantTip';
import { Icon, Intern } from '@/shared/components/atoms';
import { STICKER } from '@/shared/constants';
import { FACE_SWAP } from './constants';
import { useAssistantButtonViewModel } from './hooks';
import './styles.css';

/**
 * O rosto do Estagiário na barra de título: abre o chat dele, pensa enquanto ele
 * trabalha, conta as respostas que chegaram com ele fechado, e ancora o balão dele.
 */
export const AssistantButton: React.FC = () => {
  const {
    buttonRef,
    isOpen,
    isBusy,
    className,
    style,
    label,
    tip,
    mood,
    isStill,
    faceSize,
    badge,
    badgeLabel,
    onClick,
  } = useAssistantButtonViewModel();

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={className}
        style={style}
        aria-label={label}
        aria-expanded={isOpen}
        aria-busy={isBusy}
        title={tip}
        onClick={onClick}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {isOpen ? (
            <motion.span
              key="close"
              className="assistant-button__close"
              aria-hidden="true"
              initial={FACE_SWAP.initial}
              animate={FACE_SWAP.animate}
              exit={FACE_SWAP.exit}
            >
              <Icon name="close" />
            </motion.span>
          ) : (
            <motion.span
              key="face"
              className="assistant-button__face"
              initial={FACE_SWAP.initial}
              animate={FACE_SWAP.animate}
              exit={FACE_SWAP.exit}
            >
              <Intern mood={mood} size={faceSize} isStill={isStill} isFigure />
            </motion.span>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {badge !== null && (
            <motion.span
              key="badge"
              className="assistant-button__badge"
              aria-label={badgeLabel}
              initial={STICKER.slap.initial}
              animate={STICKER.slap.animate}
              exit={STICKER.slap.exit}
            >
              {badge}
            </motion.span>
          )}
        </AnimatePresence>
      </button>
      <AssistantTip anchorRef={buttonRef} />
    </>
  );
};
