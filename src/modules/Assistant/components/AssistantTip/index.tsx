import type { IAssistantTipProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { createPortal } from 'react-dom';
import { STICKER } from '@/shared/constants';
import { useAssistantTipViewModel } from './hooks';
import './styles.css';

/**
 * O Estagiário falando sozinho: um balão que nasce do rosto dele e digita a frase, não
 * pede resposta nem toma o foco, e volta para ele em alguns segundos.
 */
export const AssistantTip: React.FC<IAssistantTipProps> = (props) => {
  const { tip, said, unsaid, style, onClick, onPointerEnter, onPointerLeave } =
    useAssistantTipViewModel(props);

  return createPortal(
    <>
      <span className="assistant-tip__spoken" role="status" aria-live="polite">
        {tip?.text}
      </span>
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
