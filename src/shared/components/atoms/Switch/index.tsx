import type { ISwitchProps } from './types';
import { motion } from 'motion/react';
import { Icon } from '@/shared/components/atoms/Icon';
import { useSwitchViewModel } from './hooks';
import './styles.css';

/**
 * A labelled switch: its knob slides over and the track turns lime when what it names is
 * on.
 */
export const Switch: React.FC<ISwitchProps> = (props) => {
  const { className, style, hasIcon, icon, knob, knobTransition, onSwitchClick } =
    useSwitchViewModel(props);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={props.isOn}
      className={className}
      style={style}
      title={props.title}
      onClick={onSwitchClick}
    >
      {hasIcon && (
        <span className="switch__icon">
          <Icon name={icon} />
        </span>
      )}
      <span className="switch__label">{props.label}</span>
      <span className="switch__track" aria-hidden="true">
        <motion.span
          className="switch__knob"
          initial={false}
          animate={knob}
          transition={knobTransition}
        />
      </span>
    </button>
  );
};
