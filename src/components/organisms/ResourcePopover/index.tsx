import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@/components/atoms';
import { MOTION } from '@/constants';
import { useResourcePopoverViewModel } from './hooks';
import './styles.css';

export const ResourcePopover: React.FC = () => {
  const { processes, header, onClose } = useResourcePopoverViewModel();
  const { t } = useTranslation();

  return (
    <motion.div
      className="resource-popover"
      initial={{ opacity: 0, scale: 0.97, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, y: -6 }}
      transition={{ duration: MOTION.durationFast, ease: MOTION.ease }}
      style={{ transformOrigin: 'top right' }}
    >
      <header className="resource-popover__head">
        <span className="resource-popover__title">{t('RESOURCES.TITLE')}</span>
        <span className="resource-popover__header-note">{header}</span>
        <span className="resource-popover__close">
          <IconButton
            glyph="✕"
            label={t('RESOURCES.CLOSE')}
            size="sm"
            onClick={onClose}
          />
        </span>
      </header>

      <div className="resource-popover__list">
        {processes.map((process) => (
          <div key={process.pid} className="resource-popover__row">
            <span className="resource-popover__name">{process.name}</span>
            <span className="resource-popover__number">{process.cpu}%</span>
            <span className="resource-popover__number">
              {(process.ramMb / 1024).toFixed(1)} GB
            </span>
            <span className="resource-popover__number">{process.pid}</span>
          </div>
        ))}
      </div>

      <footer className="resource-popover__foot">{t('RESOURCES.NOTE')}</footer>
    </motion.div>
  );
};
