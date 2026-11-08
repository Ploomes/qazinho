import type { IRunActivityProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { Icon } from '@/shared/components/atoms';
import { MOTION } from '@/shared/constants';
import { useRunActivityViewModel } from './hooks';
import './styles.css';

/** O que o agente está fazendo agora, com o que fez logo antes acima, se apagando. */
export const RunActivity: React.FC<IRunActivityProps> = (props) => {
  const { rows } = useRunActivityViewModel(props);

  return (
    <ul className="run-activity" aria-live="polite">
      <AnimatePresence initial={false} mode="popLayout">
        {rows.map((row) => (
          <motion.li
            key={row.id}
            layout="position"
            className={row.className}
            title={row.text}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: MOTION.duration, ease: MOTION.ease }}
          >
            <span className="run-activity__mark" aria-hidden="true">
              {row.isBug ? (
                <Icon name="bug" />
              ) : row.isSay === true ? (
                <Icon name="sparkle" />
              ) : (
                <span className="run-activity__dot" />
              )}
            </span>
            <span className="run-activity__text">{row.text}</span>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
};
