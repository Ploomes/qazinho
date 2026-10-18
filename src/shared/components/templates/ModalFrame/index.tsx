import type { IModalFrameProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/atoms';
import { BACKDROP, MOTION, STICKER } from '@/shared/constants';
import { useModalFrameViewModel } from './hooks';
import './styles.css';

export const ModalFrame: React.FC<IModalFrameProps> = (props) => {
  const { onConfirmClick } = useModalFrameViewModel(props);
  const { t } = useTranslation();

  return (
    <motion.div
      className="modal-frame"
      initial={{ opacity: 0, backdropFilter: BACKDROP.clear }}
      animate={{ opacity: 1, backdropFilter: BACKDROP.blur }}
      exit={{ opacity: 0, backdropFilter: BACKDROP.clear }}
      transition={{ duration: MOTION.duration, ease: MOTION.ease }}
      onClick={props.onCancel}
    >
      <motion.div
        className="modal-frame__panel"
        style={{ width: props.width }}
        initial={STICKER.panel.initial}
        animate={STICKER.panel.animate}
        exit={STICKER.panel.exit}
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
          {props.aside}
          <AnimatePresence mode="wait" initial={false}>
            {props.hint !== undefined && (
              <motion.span
                key={props.hint}
                className="modal-frame__hint"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: MOTION.durationFast, ease: MOTION.ease }}
              >
                {props.hint}
              </motion.span>
            )}
          </AnimatePresence>
          <div className="modal-frame__actions">
            <Button onClick={props.onCancel}>{t('COMMON.CANCEL')}</Button>
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
