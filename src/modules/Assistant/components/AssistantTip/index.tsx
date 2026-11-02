import type { IAssistantTipProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { createPortal } from 'react-dom';
import { STICKER } from '@/shared/constants';
import { useAssistantTipViewModel } from './hooks';
import './styles.css';

/**
 * O Estagiário falando sozinho: um balão curto sob o rosto dele, que nunca pede resposta,
 * não toma o foco e sai depois de alguns segundos.
 */
export const AssistantTip: React.FC<IAssistantTipProps> = (props) => {
  const { tip, style, onClick, onPointerEnter, onPointerLeave } =
    useAssistantTipViewModel(props);

  return createPortal(
    <div role="status" aria-live="polite">
      <AnimatePresence mode="wait">
        {tip !== null && (
          <motion.div
            key={tip.id}
            className="assistant-tip"
            style={style}
            initial={STICKER.pop.initial}
            animate={STICKER.pop.animate}
            exit={STICKER.pop.exit}
            onClick={onClick}
            onPointerEnter={onPointerEnter}
            onPointerLeave={onPointerLeave}
          >
            {tip.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body,
  );
};
