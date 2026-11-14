import type { IconName } from '@/shared/components/atoms/Icon/types/IconName';

/** Uma escolha do menu: o que diz, o ícone, e o porquê quando ela está desligada. */
export interface IMenuButtonItem {
  key: string;
  label: string;
  icon: IconName;
  isDisabled?: boolean;
  tip?: string;
  onPick: () => void;
}
