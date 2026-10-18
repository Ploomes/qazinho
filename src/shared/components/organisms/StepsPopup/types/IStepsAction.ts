import type { ButtonVariant } from '@/shared/components/atoms/Button/types';

/** A button at the foot of the popup. */
export interface IStepsAction {
  key: string;
  label: string;
  variant: ButtonVariant;
  onClick: () => void;
}
