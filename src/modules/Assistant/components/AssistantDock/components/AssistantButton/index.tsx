import { AnimatePresence, motion } from 'motion/react';
import { Intern } from '@/shared/components/atoms';
import { STICKER } from '@/shared/constants';
import { FACE_SWAP } from './constants';
import { useAssistantButtonViewModel } from './hooks';
import './styles.css';

/** The Estagiário's face on a sticker in the corner: it opens his chat, thinks while he works, and counts the answers that came while it was shut. */
export const AssistantButton: React.FC = () => {
  const {
    isOpen,
    className,
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
    <button
      type="button"
      className={className}
      aria-label={label}
      aria-expanded={isOpen}
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
            ✕
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
  );
};
