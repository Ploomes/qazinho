import type { IEditableTextProps } from './types';
import { useEditableTextViewModel } from './hooks';
import './styles.css';

export const EditableText: React.FC<IEditableTextProps> = (props) => {
  const { value, isLocked, isAutoFocused, className, onChange } =
    useEditableTextViewModel(props);

  return (
    <textarea
      className={className}
      value={value}
      rows={1}
      placeholder={props.placeholder}
      readOnly={isLocked}
      autoFocus={isAutoFocused}
      spellCheck={false}
      onChange={onChange}
    />
  );
};
