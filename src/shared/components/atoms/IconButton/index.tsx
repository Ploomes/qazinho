import type { IIconButtonProps } from './types';
import { Icon } from '@/shared/components/atoms/Icon';
import { useIconButtonViewModel } from './hooks';
import './styles.css';

export const IconButton: React.FC<IIconButtonProps> = (props) => {
  const { className, iconSize, popup, onIconClick } = useIconButtonViewModel(props);

  return (
    <button
      type="button"
      className={className}
      aria-label={props.label}
      aria-haspopup={popup}
      onClick={onIconClick}
    >
      <Icon name={props.icon} size={iconSize} />
    </button>
  );
};
