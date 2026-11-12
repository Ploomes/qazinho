import type { ISwitchProps } from './types';
import { motion } from 'motion/react';
import { Icon } from '@/shared/components/atoms/Icon';
import { useSwitchViewModel } from './hooks';
import './styles.css';

/**
 * Um switch com rótulo: o botão desliza e o trilho fica lima quando o que ele nomeia está
 * ligado.
 */
export const Switch: React.FC<ISwitchProps> = (props) => {
  const {
    className,
    labelClassName,
    style,
    hasIcon,
    icon,
    knob,
    knobTransition,
    onSwitchClick,
  } = useSwitchViewModel(props);

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
      <span className={labelClassName}>{props.label}</span>
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
