import type { ITooltipProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { MOTION } from '@/shared/constants';
import { useTooltipViewModel } from './hooks';
import './styles.css';

export const Tooltip: React.FC<ITooltipProps> = (props) => {
  const { isOpen, style, onOpen, onClose } = useTooltipViewModel();

  return (
    <span
      className="tooltip"
      onPointerEnter={onOpen}
      onPointerLeave={onClose}
      onFocus={onOpen}
      onBlur={onClose}
    >
      {props.children}

      <AnimatePresence>
        {isOpen && (
          <motion.span
            key="tip"
            className="tooltip__panel"
            style={style}
            role="tooltip"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: MOTION.durationFast, ease: MOTION.ease }}
          >
            {props.content}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
};
