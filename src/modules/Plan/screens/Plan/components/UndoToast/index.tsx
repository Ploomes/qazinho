import type { IUndoToastProps } from './types';
import { motion } from 'motion/react';
import { Icon } from '@/shared/components/atoms';
import { STICKER } from '@/shared/constants';
import { useUndoToastViewModel } from './hooks';
import './styles.css';

/**
 * Uma remoção que o QA pode desfazer por alguns segundos, com uma linha na borda de baixo
 * que esvazia enquanto isso.
 */
export const UndoToast: React.FC<IUndoToastProps> = (props) => {
  const { style, onUndoClick, onCountdownEnd } = useUndoToastViewModel(props);

  return (
    <motion.div
      className="undo-toast"
      role="status"
      style={style}
      initial={STICKER.rise.initial}
      animate={STICKER.rise.animate}
      exit={STICKER.rise.exit}
    >
      <span className="undo-toast__text">{props.text}</span>
      <button type="button" className="undo-toast__undo" onClick={onUndoClick}>
        <Icon name="undo" />
        {props.actionLabel}
      </button>
      <span
        className="undo-toast__time"
        aria-hidden="true"
        onAnimationEnd={onCountdownEnd}
      />
    </motion.div>
  );
};
