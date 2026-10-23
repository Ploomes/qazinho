import type { IToTopProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/shared/components/atoms';
import { MOTION } from '@/shared/constants';
import './styles.css';

/** A quiet pill at the foot of a long screen that scrolls it back to the top. */
export const ToTop: React.FC<IToTopProps> = ({ isShown, onClick }) => {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {isShown && (
        <motion.button
          key="to-top"
          type="button"
          className="to-top"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: MOTION.duration, ease: MOTION.ease }}
          onClick={onClick}
        >
          <Icon name="up" /> {t('COMMON.TO_TOP')}
        </motion.button>
      )}
    </AnimatePresence>
  );
};
