import type { IMenuButtonItem } from './IMenuButtonItem';
import type { IconName } from '@/shared/components/atoms/Icon/types/IconName';

/** Um botão discreto que abre uma lista de escolhas abaixo dele. */
export interface IMenuButtonProps {
  label: string;
  icon: IconName;
  items: IMenuButtonItem[];
}
