import type { ICaretProps } from '@/shared/components/atoms/Caret/types';

export const useCaretViewModel = (props: ICaretProps) => ({
  className: props.isOpen ? 'caret caret--open' : 'caret',
});
