import type { IIconButtonProps } from './types';
import { useIconButtonViewModel } from './hooks';
import './styles.css';

export const IconButton: React.FC<IIconButtonProps> = (props) => {
  const { className, onIconClick } = useIconButtonViewModel(props);

  return (
    <button
      type="button"
      className={className}
      aria-label={props.label}
      onClick={onIconClick}
    >
      <span aria-hidden="true">{props.glyph}</span>
    </button>
  );
};
