import type { IconName } from '@/shared/components/atoms/Icon/types';

/**
 * Um switch que liga ou desliga uma coisa, nomeada pelo rótulo e, quando dado, por um
 * ícone antes dele.
 */
export interface ISwitchProps {
  label: string;
  isOn: boolean;
  onChange: (isOn: boolean) => void;
  icon?: IconName;
  title?: string;
}
