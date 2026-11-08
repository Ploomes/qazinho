import type { IMemoriesPaneProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { IconButton } from '@/shared/components/atoms';
import { STICKER } from '@/shared/constants';
import { useMemoriesPaneViewModel } from './hooks';
import './styles.css';

/** O que o agente aprendeu sobre o app, para ver e apagar. */
export const MemoriesPane: React.FC<IMemoriesPaneProps> = (props) => {
  const { rows, hasRows, lead, forgetLabel } = useMemoriesPaneViewModel(props);

  return (
    <div className="memories-pane">
      <p className="memories-pane__lead">{lead}</p>
      {hasRows && (
        <ul className="memories-pane__list">
          <AnimatePresence initial={false}>
            {rows.map((row) => (
              <motion.li
                key={row.id}
                layout
                className="memories-pane__row"
                initial={STICKER.slap.initial}
                animate={STICKER.slap.animate}
                exit={STICKER.slap.exit}
              >
                <div className="memories-pane__body">
                  <p className="memories-pane__text">{row.text}</p>
                  {row.where !== '' && (
                    <span className="memories-pane__where">{row.where}</span>
                  )}
                </div>
                <IconButton
                  icon="close"
                  size="sm"
                  label={forgetLabel}
                  onClick={row.onForget}
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
};
