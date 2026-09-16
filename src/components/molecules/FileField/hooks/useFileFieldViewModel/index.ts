import type { IFileFieldProps } from '@/components/molecules/FileField/types';

export const useFileFieldViewModel = (props: IFileFieldProps) => {
  const isEmpty = props.value.trim().length === 0;

  return {
    isEmpty,
    text: isEmpty ? props.placeholder : (props.value.split('/').at(-1) ?? props.value),
    className: isEmpty ? 'file-field file-field--empty' : 'file-field',
    onFieldClick: props.onPick,
  };
};
