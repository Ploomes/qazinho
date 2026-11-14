import type { IFieldCardProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { Icon } from '@/shared/components/atoms';
import { STICKER } from '@/shared/constants';
import './styles.css';

/** Um campo da criação de um projeto: o cartão que ele marcou, o controle e o estado. */
export const FieldCard: React.FC<IFieldCardProps> = (props) => (
  <div className="field-card">
    <div className="field-card__head">
      <span className="field-card__icon">
        <Icon name={props.icon} />
      </span>
      <span className="field-card__label">{props.label}</span>
    </div>
    <div className="field-card__body">{props.children}</div>
    <AnimatePresence mode="wait" initial={false}>
      <motion.p
        key={props.statusText}
        className={props.statusClassName}
        initial={STICKER.rise.initial}
        animate={STICKER.rise.animate}
        exit={STICKER.rise.exit}
      >
        {props.statusText}
      </motion.p>
    </AnimatePresence>
  </div>
);
