import type { ICountTileProps } from './types';
import { motion } from 'motion/react';
import { STICKER } from '@/shared/constants';
import './styles.css';

export const CountTile: React.FC<ICountTileProps> = (props) => (
  <motion.div
    className={`count-tile count-tile--${props.status}`}
    initial={STICKER.slap.initial}
    animate={{ opacity: 1, scale: 1, rotate: 0 }}
    transition={{ ...STICKER.spring, delay: props.delay }}
  >
    <span className="count-tile__count">{props.count}</span>
    <span className="count-tile__label">
      <span aria-hidden="true">{props.glyph}</span> {props.label}
    </span>
  </motion.div>
);
