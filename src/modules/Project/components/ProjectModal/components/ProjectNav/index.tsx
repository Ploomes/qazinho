import type { IProjectNavProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { MOTION } from '@/shared/constants';
import { PROJECT_NAV_MARK } from './constants';
import { useProjectNavViewModel } from './hooks';
import './styles.css';

/** The project window's sections down its side: the open one marked, what each holds counted, and a dot on one that keeps the project from saving. */
export const ProjectNav: React.FC<IProjectNavProps> = (props) => {
  const { items } = useProjectNavViewModel(props);

  return (
    <nav className="project-nav" aria-label={props.label}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={item.className}
          aria-current={item.isActive}
          onClick={item.onClick}
        >
          {item.isActive && (
            <motion.span
              layoutId={PROJECT_NAV_MARK}
              className="project-nav__mark"
              transition={{ duration: MOTION.duration, ease: MOTION.ease }}
            />
          )}
          <span className="project-nav__label">{item.label}</span>
          <span className="project-nav__end">
            <AnimatePresence initial={false}>
              {item.count !== null && (
                <motion.span
                  key="count"
                  className="project-nav__count"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={{ duration: MOTION.durationFast, ease: MOTION.ease }}
                >
                  {item.count}
                </motion.span>
              )}
              {item.isFlagged && (
                <motion.span
                  key="flag"
                  className="project-nav__flag"
                  initial={{ opacity: 0, scale: 0.4 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.4 }}
                  transition={{ duration: MOTION.durationFast, ease: MOTION.ease }}
                >
                  <span className="project-nav__flag-word">{props.flagWord}</span>
                </motion.span>
              )}
            </AnimatePresence>
          </span>
        </button>
      ))}
    </nav>
  );
};
