import type { PillStatus } from './PillStatus';

export interface IStatusPillProps {
  status: PillStatus;
  label?: string;
  shape?: 'square' | 'round';
}
