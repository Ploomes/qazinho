import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@/shared/components/atoms';
import { MOTION } from '@/shared/constants';
import { useResourcePopoverViewModel } from './hooks';
import './styles.css';

export const ResourcePopover: React.FC = () => {
  const { ref, nodes, header, onClose, onShutDown } = useResourcePopoverViewModel();
  const { t } = useTranslation();

  return (
    <motion.div
      ref={ref}
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
        {nodes.map((node) => (
          <div
            key={node.id}
            className={`resource-popover__row resource-popover__row--${String(node.level)}`}
          >
            <span className="resource-popover__name">{node.name}</span>
            <span className="resource-popover__number">{node.cpu}%</span>
            <span className="resource-popover__number">{node.ramGb.toFixed(2)} GB</span>
            {node.canShutDown && node.workspaceId !== null ? (
              <button
                type="button"
                className="resource-popover__kill"
                onClick={() => {
                  onShutDown(node.workspaceId ?? '');
                }}
              >
                {t('RESOURCES.SHUT_DOWN')}
              </button>
            ) : (
              <span />
            )}
          </div>
        ))}
      </div>

      <footer className="resource-popover__foot">{t('RESOURCES.NOTE')}</footer>
    </motion.div>
  );
};
