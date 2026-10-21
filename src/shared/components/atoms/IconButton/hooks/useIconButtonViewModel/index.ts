import type { IIconButtonProps } from '@/shared/components/atoms/IconButton/types';
import { ICON_BUTTON } from '@/shared/components/atoms/IconButton/constants';

export const useIconButtonViewModel = (props: IIconButtonProps) => {
  const { size = 'md', isActive = false } = props;

  return {
    className: [
      'icon-button',
      `icon-button--${size}`,
      isActive ? 'icon-button--active' : '',
    ]
      .filter((part) => part.length > 0)
      .join(' '),
    iconSize: ICON_BUTTON.iconSize[size],
    onIconClick: props.onClick,
  };
};
