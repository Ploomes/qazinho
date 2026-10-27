import type { IProjectPaneProps } from './types';
import { motion } from 'motion/react';
import { PANE_MOTION } from './constants';
import { useProjectPaneViewModel } from './hooks';
import './styles.css';

/**
 * A section of the project window: it fades in when its nav item opens, and stays mounted
 * while shut, so nothing typed in it is lost.
 */
export const ProjectPane: React.FC<IProjectPaneProps> = (props) => {
  const { animate, isShut } = useProjectPaneViewModel(props);

  return (
    <motion.section
      className="project-pane"
      aria-label={props.label}
      aria-hidden={isShut}
      inert={isShut}
      initial={false}
      animate={animate}
      variants={PANE_MOTION}
    >
      {props.children}
    </motion.section>
  );
};
