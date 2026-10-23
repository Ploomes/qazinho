export interface IEditableTextProps {
  value: string;
  placeholder: string;
  isLocked?: boolean;
  isTitle?: boolean;
  isAutoFocused?: boolean;
  onCommit: (value: string) => void;
}
