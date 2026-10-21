import type { IInputProps } from '@/shared/components/atoms/Input/types';
import type { ChangeEvent } from 'react';

export const useInputViewModel = (props: IInputProps) => {
  const {
    onChange,
    isMono = false,
    isCompact = false,
    isBare = false,
    isSecret = false,
  } = props;

  const className = [
    'input',
    isMono ? 'input--mono' : '',
    isCompact ? 'input--compact' : '',
    isBare ? 'input--bare' : '',
  ]
    .filter((part) => part.length > 0)
    .join(' ');

  return {
    className,
    type: isSecret ? 'password' : 'text',
    onInputChange: (event: ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.value);
    },
  };
};
