import type { IconName } from '@/shared/components/atoms/Icon/types';

export interface IHandoffCardProps {
  icon: IconName;
  title: string;
  subtitle: string;
  action: string;
  onOpen: () => void;
  isAccent?: boolean;
}
