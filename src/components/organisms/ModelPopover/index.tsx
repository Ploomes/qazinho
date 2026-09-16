import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Eyebrow } from '@/components/atoms';
import { MOTION } from '@/constants';
import { useModelPopoverViewModel } from './hooks';
import './styles.css';

export const ModelPopover: React.FC = () => {
  const { agents, agent, models, model, modelHeading, onSelectAgent, onSelectModel } =
    useModelPopoverViewModel();
  const { t } = useTranslation();

  return (
    <motion.div
      className="model-popover"
      initial={{ opacity: 0, scale: 0.97, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, y: -6 }}
      transition={{ duration: MOTION.durationFast, ease: MOTION.ease }}
      style={{ transformOrigin: 'top right' }}
    >
      <div className="model-popover__section">
        <Eyebrow>{t('MODEL.AGENT_ON_MACHINE')}</Eyebrow>
        {agents.map((item) => (
          <button
            key={item.name}
            type="button"
            className={
              item.name === agent
                ? 'model-popover__row model-popover__row--selected'
                : 'model-popover__row'
            }
            disabled={!item.isFound}
            onClick={() => {
              onSelectAgent(item.name);
            }}
          >
            {item.name}
            <span className="model-popover__note">{item.note}</span>
          </button>
        ))}
      </div>

      <div className="model-popover__section">
        <Eyebrow>{modelHeading}</Eyebrow>
        {models.map((item) => (
          <button
            key={item.id}
            type="button"
            className={
              item.id === model
                ? 'model-popover__row model-popover__row--selected'
                : 'model-popover__row'
            }
            disabled={item.isLocked}
            onClick={() => {
              onSelectModel(item.id);
            }}
          >
            {item.name}
            <span
              className={
                item.isLocked
                  ? 'model-popover__note model-popover__note--locked'
                  : 'model-popover__note'
              }
            >
              {item.note}
            </span>
          </button>
        ))}
      </div>

      <footer className="model-popover__foot">{t('MODEL.FOOTER')}</footer>
    </motion.div>
  );
};
