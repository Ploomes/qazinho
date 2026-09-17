import type { IInputProps } from '@/components/atoms/Input/types';
import type { ChangeEvent } from 'react';

export const useInputViewModel = (props: IInputProps) => {
  const { onChange, isMono = false, isBare = false, isSecret = false } = props;

  const className = ['input', isMono ? 'input--mono' : '', isBare ? 'input--bare' : '']
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
