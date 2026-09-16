export interface IEditableTextProps {
  value: string;
  placeholder: string;
  isLocked?: boolean;
  isTitle?: boolean;
  onCommit: (value: string) => void;
}
