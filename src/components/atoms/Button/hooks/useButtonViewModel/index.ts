import type { IButtonProps } from '@/components/atoms/Button/types';
import { useCallback } from 'react';

export const useButtonViewModel = (props: IButtonProps) => {
  const { variant = 'secondary', size = 'md', disabled = false, onClick } = props;

  const className = ['button', `button--${variant}`, `button--${size}`].join(' ');

  const onButtonClick = useCallback(() => {
    if (disabled) return;
    onClick?.();
  }, [disabled, onClick]);

  return { className, onButtonClick, isDisabled: disabled };
};
