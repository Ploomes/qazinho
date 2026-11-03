import { AnimatePresence, motion } from 'motion/react';
import { Icon } from '@/shared/components/atoms';
import { Tooltip } from '@/shared/components/molecules';
import { STICKER } from '@/shared/constants';
import { useUpdateButtonViewModel } from './hooks/useUpdateButtonViewModel';
import './styles.css';

/** O aviso discreto de que uma versão nova já foi baixada, e o que a instala. */
export const UpdateButton: React.FC = () => {
  const { isShown, label, tip, isDisabled, onClick } = useUpdateButtonViewModel();

  return (
    <AnimatePresence>
      {isShown && (
        <motion.span
          key="update"
          className="update-button"
          initial={STICKER.slap.initial}
          animate={STICKER.slap.animate}
          exit={STICKER.slap.exit}
        >
          <Tooltip content={tip}>
            <button
              type="button"
              className="update-button__action"
              disabled={isDisabled}
              onClick={onClick}
            >
              <Icon name="update" />
              {label}
            </button>
          </Tooltip>
        </motion.span>
      )}
    </AnimatePresence>
  );
};
