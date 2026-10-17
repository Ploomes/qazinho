import type { IFileFieldProps } from './types';
import { useFileFieldViewModel } from './hooks';
import './styles.css';

export const FileField: React.FC<IFileFieldProps> = (props) => {
  const { text, className, onFieldClick } = useFileFieldViewModel(props);

  return (
    <button
      type="button"
      className={className}
      aria-label={props.label}
      title={props.value}
      onClick={onFieldClick}
    >
      {text}
    </button>
  );
};
