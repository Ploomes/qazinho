import type { IconName } from '@/shared/components/atoms/Icon/types';
import type { PillStatus } from '@/shared/components/atoms/StatusPill/types';

export interface ICountTileProps {
  status: PillStatus;
  icon: IconName;
  count: number;
  label: string;
  delay?: number;
}
