import type { IconName } from '@/shared/components/atoms/Icon/types';

export interface IIconButtonProps {
  icon: IconName;
  label: string;
  onClick: () => void;
  size?: 'sm' | 'md';
  isActive?: boolean;
  popup?: 'menu' | 'dialog';
}
