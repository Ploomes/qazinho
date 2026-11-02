import type { IFoldProps } from './types';
import { motion } from 'motion/react';
import { FOLD } from './constants';
import './styles.css';

/**
 * Uma dobra: o que entra cresce e aparece, e o que sai encolhe e some.
 * O espaçamento fica no filho, que a altura zero não espreme.
 */
export const Fold: React.FC<IFoldProps> = (props) => (
  <motion.div
    className="fold"
    initial={FOLD.initial}
    animate={FOLD.animate}
    exit={FOLD.exit}
  >
    <div className={props.className}>{props.children}</div>
  </motion.div>
);
