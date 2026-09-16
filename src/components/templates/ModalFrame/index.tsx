import type { IModalFrameProps } from './types';
import { motion } from 'motion/react';
import { Button } from '@/components/atoms';
import { MOTION } from '@/constants';
import { useModalFrameViewModel } from './hooks';
import './styles.css';

export const ModalFrame: React.FC<IModalFrameProps> = (props) => {
  const { onConfirmClick } = useModalFrameViewModel(props);

  return (
    <motion.div
      className="modal-frame"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: MOTION.durationFast }}
      onClick={props.onCancel}
    >
      <motion.div
        className="modal-frame__panel"
        style={{ width: props.width }}
        initial={{ opacity: 0, scale: 0.97, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 6 }}
        transition={{ duration: MOTION.duration, ease: MOTION.ease }}
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <header className="modal-frame__head">
          <h2 className="modal-frame__title">{props.title}</h2>
          <p className="modal-frame__subtitle">{props.subtitle}</p>
        </header>

        <div className="modal-frame__body">{props.children}</div>

        <footer className="modal-frame__foot">
          {props.hint !== undefined && (
            <span className="modal-frame__hint">{props.hint}</span>
          )}
          <div className="modal-frame__actions">
            <Button onClick={props.onCancel}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!props.canConfirm}
              onClick={onConfirmClick}
            >
              {props.confirmLabel}
            </Button>
          </div>
        </footer>
      </motion.div>
    </motion.div>
  );
};
