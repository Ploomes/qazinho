import type { ITooltipProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { createPortal } from 'react-dom';
import { MOTION } from '@/shared/constants';
import { useTooltipViewModel } from './hooks';
import './styles.css';

/**
 * Algumas palavras sobre o que o ponteiro ou o foco toca: embaixo, ou ao lado por cima de
 * tudo, para nenhuma borda cortá-la.
 */
export const Tooltip: React.FC<ITooltipProps> = (props) => {
  const {
    anchorRef,
    isOpen,
    isBeside,
    panelClassName,
    hidden,
    shown,
    style,
    onOpen,
    onClose,
  } = useTooltipViewModel(props);

  const panel = (
    <AnimatePresence>
      {isOpen && (
        <motion.span
          key="tip"
          className={panelClassName}
          style={style}
          role="tooltip"
          initial={hidden}
          animate={shown}
          exit={hidden}
          transition={{ duration: MOTION.durationFast, ease: MOTION.ease }}
        >
          {props.content}
        </motion.span>
      )}
    </AnimatePresence>
  );

  return (
    <span
      ref={anchorRef}
      className="tooltip"
      onPointerEnter={onOpen}
      onPointerLeave={onClose}
      onFocus={onOpen}
      onBlur={onClose}
    >
      {props.children}
      {isBeside ? createPortal(panel, document.body) : panel}
    </span>
  );
};
