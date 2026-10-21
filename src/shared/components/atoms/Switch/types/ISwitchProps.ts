import type { IconName } from '@/shared/components/atoms/Icon/types';

/** A switch that turns one thing on or off, named by its label and, when given, an icon before it. */
export interface ISwitchProps {
  label: string;
  isOn: boolean;
  onChange: (isOn: boolean) => void;
  icon?: IconName;
  title?: string;
}
