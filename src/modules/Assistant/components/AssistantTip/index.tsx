import type { IAssistantTipProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { createPortal } from 'react-dom';
import { Intern } from '@/shared/components/atoms';
import { MOTION, STICKER } from '@/shared/constants';
import { FACE_HOP } from './constants';
import { useAssistantTipViewModel } from './hooks';
import './styles.css';

/**
 * O Estagiário falando por cima de tudo: o rosto dele aceso e um balão que nasce dele e
 * digita a frase, sem pedir resposta nem tomar o foco, até sair em alguns segundos.
 */
export const AssistantTip: React.FC<IAssistantTipProps> = (props) => {
  const { tip, said, unsaid, faceSize, style, onClick, onPointerEnter, onPointerLeave } =
    useAssistantTipViewModel(props);

  return createPortal(
    <>
      <span className="assistant-tip__spoken" role="status" aria-live="polite">
        {tip?.text}
      </span>
      <AnimatePresence>
        {tip !== null && (
          <motion.span
            key="face"
            className="assistant-tip__face"
            style={style}
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={FACE_HOP}
            exit={{ opacity: 0, transition: { duration: MOTION.durationFast } }}
          >
            <Intern mood="neutral" size={faceSize} isFigure />
          </motion.span>
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        {tip !== null && (
          <motion.div
            key={tip.id}
            className="assistant-tip"
            style={style}
            aria-hidden="true"
            initial={STICKER.speak.initial}
            animate={STICKER.speak.animate}
            exit={STICKER.speak.exit}
            onClick={onClick}
            onPointerEnter={onPointerEnter}
            onPointerLeave={onPointerLeave}
          >
            {said}
            <span className="assistant-tip__unsaid">{unsaid}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.body,
  );
};
