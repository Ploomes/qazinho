export interface IInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  isMono?: boolean;
  isBare?: boolean;
  isSecret?: boolean;
}
