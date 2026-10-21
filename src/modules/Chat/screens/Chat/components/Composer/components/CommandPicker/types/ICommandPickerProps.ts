import type { ICommandPicker } from '@/modules/Chat/types';

export interface ICommandPickerProps {
  picker: ICommandPicker;
  highlighted: number;
  onPick: (id: string) => void;
  onHighlight: (index: number) => void;
}
