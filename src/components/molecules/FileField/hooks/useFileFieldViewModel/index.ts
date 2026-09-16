import type { IFileFieldProps } from '@/components/molecules/FileField/types';

export const useFileFieldViewModel = (props: IFileFieldProps) => {
  const isEmpty = props.value.trim().length === 0;

  return {
    isEmpty,
    // A path is read from its end: which build it is matters more than where it lives.
    text: isEmpty ? props.placeholder : (props.value.split('/').at(-1) ?? props.value),
    className: isEmpty ? 'file-field file-field--empty' : 'file-field',
    onFieldClick: props.onPick,
  };
};
