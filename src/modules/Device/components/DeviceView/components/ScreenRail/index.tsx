import type { IScreenRailProps } from './types';
import { motion } from 'motion/react';
import { Intern } from '@/shared/components/atoms';
import { MOTION } from '@/shared/constants';
import { useScreenRailViewModel } from './hooks';
import './styles.css';

/** As telas abertas numa run, em miniatura: em qual o agente está e qual o QA vê. */
export const ScreenRail: React.FC<IScreenRailProps> = (props) => {
  const { screens } = useScreenRailViewModel(props);

  return (
    <motion.div
      className="screen-rail"
      role="group"
      aria-label={props.label}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: MOTION.duration, ease: MOTION.ease }}
    >
      {screens.map((screen) => (
        <button
          key={screen.id}
          type="button"
          className={screen.className}
          title={screen.tip}
          aria-label={screen.tip}
          aria-pressed={screen.isShown}
          onClick={() => {
            props.onPick(screen.id);
          }}
        >
          <span className="screen-rail__number">{screen.id}</span>
          <span className="screen-rail__picture">
            {screen.picture !== null && <img src={screen.picture} alt="" />}
            {screen.isAgent && (
              <span className="screen-rail__agent">
                <Intern mood="running" size={20} isStill />
              </span>
            )}
          </span>
        </button>
      ))}
    </motion.div>
  );
};
