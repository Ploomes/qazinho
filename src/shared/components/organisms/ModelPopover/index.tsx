import type { IModelPopoverProps } from './types';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Eyebrow } from '@/shared/components/atoms';
import { STICKER } from '@/shared/constants';
import { useModelPopoverViewModel } from './hooks';
import './styles.css';

export const ModelPopover: React.FC<IModelPopoverProps> = (props) => {
  const {
    ref,
    agents,
    agent,
    models,
    model,
    modelHeading,
    onSelectAgent,
    onSelectModel,
  } = useModelPopoverViewModel();
  const { t } = useTranslation();

  return (
    <motion.div
      ref={ref}
      className={`model-popover model-popover--${props.at}`}
      initial={STICKER.pop.initial}
      animate={STICKER.pop.animate}
      exit={STICKER.pop.exit}
      style={{ transformOrigin: props.at === 'titlebar' ? 'top right' : 'bottom left' }}
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
            {item.note !== null && (
              <span className="model-popover__note">{item.note}</span>
            )}
          </button>
        ))}
      </div>
    </motion.div>
  );
};
