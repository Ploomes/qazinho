import type { IButtonProps } from './types';
import { useButtonViewModel } from './hooks';
import './styles.css';

export const Button: React.FC<IButtonProps> = (props) => {
  const { className, onButtonClick, isDisabled } = useButtonViewModel(props);

  return (
    <button
      type="button"
      className={className}
      disabled={isDisabled}
      aria-pressed={props.pressed}
      aria-expanded={props.expanded}
      aria-haspopup={props.popup}
      onClick={onButtonClick}
    >
      {props.children}
    </button>
  );
};
