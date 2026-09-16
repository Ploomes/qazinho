import type { ICountTileProps } from './types';
import { motion } from 'motion/react';
import { MOTION } from '@/constants';
import './styles.css';

export const CountTile: React.FC<ICountTileProps> = (props) => (
  <motion.div
    className={`count-tile count-tile--${props.status}`}
    initial={{ opacity: 0, scale: 0.97, y: 6 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ duration: MOTION.duration, ease: MOTION.ease }}
  >
    <span className="count-tile__count">{props.count}</span>
    <span className="count-tile__label">{props.label}</span>
  </motion.div>
);
