import type { IInputProps } from './types';
import { useInputViewModel } from './hooks';
import './styles.css';

export const Input: React.FC<IInputProps> = (props) => {
  const {
    value,
    placeholder,
    label,
    isAutoFocused,
    inputRef,
    onPointerDown,
    onBlur,
    onKeyDown,
  } = props;
  const { className, type, onInputChange } = useInputViewModel(props);

  return (
    <input
      ref={inputRef}
      type={type}
      className={className}
      value={value}
      placeholder={placeholder}
      aria-label={label}
      autoFocus={isAutoFocused}
      onChange={onInputChange}
      onPointerDown={onPointerDown}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
    />
  );
};
