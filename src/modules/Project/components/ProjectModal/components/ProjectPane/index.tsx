import type { IProjectPaneProps } from './types';
import { motion } from 'motion/react';
import { PANE_MOTION } from './constants';
import { useProjectPaneViewModel } from './hooks';
import './styles.css';

/**
 * Uma seção da janela do projeto: aparece com fade quando o item do nav abre, e fica
 * montada enquanto fechada, para nada digitado nela se perder.
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
