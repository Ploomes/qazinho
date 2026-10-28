import type { ButtonVariant } from '@/shared/components/atoms/Button/types';

/** Um botão no pé do popup. */
export interface IStepsAction {
  key: string;
  label: string;
  variant: ButtonVariant;
  onClick: () => void;
}
