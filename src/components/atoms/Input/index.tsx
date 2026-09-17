import type { IInputProps } from './types';
import { useInputViewModel } from './hooks';
import './styles.css';

export const Input: React.FC<IInputProps> = (props) => {
  const { className, type, onInputChange } = useInputViewModel(props);

  return (
    <input
      type={type}
      className={className}
      value={props.value}
      placeholder={props.placeholder}
      aria-label={props.label}
      onChange={onInputChange}
    />
  );
};
