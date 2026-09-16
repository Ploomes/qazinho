import type { PillStatus } from '@/components/atoms/StatusPill/types';

export interface ICountTileProps {
  status: PillStatus;
  count: number;
  label: string;
}
