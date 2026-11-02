import type { ISegmentedOption } from './ISegmentedOption';

export interface ISegmentedControlProps {
  label: string;
  options: ISegmentedOption[];
  value: string;
  onChange: (id: string) => void;
}
