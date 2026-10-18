import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@/shared/components/atoms';
import { BACKDROP, MOTION, STICKER } from '@/shared/constants';
import { useLightboxViewModel } from './hooks';
import './styles.css';

export const Lightbox: React.FC = () => {
  const { media, shot, frameWidth, onClose } = useLightboxViewModel();
  const { t } = useTranslation();

  if (media === null) return null;

  return (
    <motion.div
      className="lightbox"
      initial={{ opacity: 0, backdropFilter: BACKDROP.clear }}
      animate={{ opacity: 1, backdropFilter: BACKDROP.blur }}
      exit={{ opacity: 0, backdropFilter: BACKDROP.clear }}
      transition={{ duration: MOTION.duration, ease: MOTION.ease }}
      onClick={onClose}
    >
      <motion.div
        className="lightbox__panel"
        style={{ width: frameWidth }}
        initial={{ opacity: 0, scale: 0.96, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0, transition: STICKER.spring }}
        exit={{
          opacity: 0,
          scale: 0.98,
          y: 8,
          transition: { duration: MOTION.durationFast, ease: MOTION.easeIn },
        }}
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <header className="lightbox__panel-head">
          <span className="lightbox__kicker">{media.kicker}</span>
          <span className="lightbox__title">{media.title}</span>
          <span className="lightbox__close">
            <IconButton glyph="✕" label={t('COMMON.CLOSE')} size="sm" onClick={onClose} />
          </span>
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
