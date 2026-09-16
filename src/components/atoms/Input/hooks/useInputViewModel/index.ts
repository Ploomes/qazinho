import type { IInputProps } from '@/components/atoms/Input/types';
import type { ChangeEvent } from 'react';
import { useCallback } from 'react';

export const useInputViewModel = (props: IInputProps) => {
  const { onChange, isMono = false, isBare = false } = props;

  const className = ['input', isMono ? 'input--mono' : '', isBare ? 'input--bare' : '']
    .filter((part) => part.length > 0)
    .join(' ');

  const onInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.value);
    },
    [onChange],
  );

  return { className, onInputChange };
};
