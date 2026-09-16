import type { PillStatus } from '@/components/atoms/StatusPill/types';

export interface ICountTileProps {
  status: PillStatus;
  glyph: string;
  count: number;
  label: string;
  delay?: number;
}
