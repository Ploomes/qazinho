import type { KeyboardEvent, Ref } from 'react';

export interface IInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  isMono?: boolean;
  isCompact?: boolean;
  isBare?: boolean;
  isSecret?: boolean;
  isAutoFocused?: boolean;
  inputRef?: Ref<HTMLInputElement>;
  onPointerDown?: () => void;
  onBlur?: () => void;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
}
