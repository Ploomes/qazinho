import type { ICountTileProps } from './types';
import { motion } from 'motion/react';
import { MOTION } from '@/constants';
import './styles.css';

export const CountTile: React.FC<ICountTileProps> = (props) => (
  <motion.div
    className={`count-tile count-tile--${props.status}`}
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: MOTION.durationSlow, ease: MOTION.ease, delay: props.delay }}
  >
    <span className="count-tile__count">{props.count}</span>
    <span className="count-tile__label">
      <span aria-hidden="true">{props.glyph}</span> {props.label}
    </span>
  </motion.div>
);
