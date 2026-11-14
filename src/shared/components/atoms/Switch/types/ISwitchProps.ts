import type { IconName } from '@/shared/components/atoms/Icon/types';

/**
 * Um switch que liga ou desliga uma coisa, nomeada pelo rótulo (escondido numa linha que
 * já a nomeia) e, quando dado, por um ícone antes dele.
 */
export interface ISwitchProps {
  label: string;
  isOn: boolean;
  onChange: (isOn: boolean) => void;
  icon?: IconName;
  title?: string;
  isLabelHidden?: boolean;
}
