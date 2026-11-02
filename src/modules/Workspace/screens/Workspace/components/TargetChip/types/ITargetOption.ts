import type { TargetKind } from '@/shared/types';

/** Uma plataforma no popover de targets: o build que ela tem e como trocá-lo. */
export interface ITargetOption {
  kind: TargetKind;
  kindLabel: string;
  value: string;
  hasValue: boolean;
  isActive: boolean;
  chooseLabel: string;
  onSelect: () => void;
  onChoose: () => void;
}
