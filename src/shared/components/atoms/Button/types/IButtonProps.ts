import type { ButtonSize } from './ButtonSize';
import type { ButtonVariant } from './ButtonVariant';
import type { ReactNode } from 'react';

export interface IButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
}
