import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Eyebrow, IconButton } from '@/components/atoms';
import { MOTION } from '@/constants';
import { useLightboxViewModel } from './hooks';
import './styles.css';

export const Lightbox: React.FC = () => {
  const { media, shot, frameWidth, onClose } = useLightboxViewModel();
  const { t } = useTranslation();

  if (media === null) return null;

  return (
    <motion.div
      className="lightbox"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: MOTION.durationFast }}
      onClick={onClose}
    >
      <motion.div
        className="lightbox__panel"
        style={{ width: frameWidth }}
        initial={{ opacity: 0, scale: 0.92, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 14 }}
        transition={{ duration: MOTION.duration, ease: MOTION.ease }}
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <header className="lightbox__panel-head">
          <Eyebrow>{media.kicker}</Eyebrow>
          <span className="lightbox__title">{media.title}</span>
          <IconButton glyph="✕" label="Close" size="sm" onClick={onClose} />
        </header>

        <div
          className={
            media.isTall ? 'lightbox__frame lightbox__frame--tall' : 'lightbox__frame'
          }
        >
          {shot === null ? (
            <p className="lightbox__missing">{t('RUN.NO_SHOT')}</p>
          ) : (
            <img className="lightbox__shot" src={shot} alt={media.title} />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
