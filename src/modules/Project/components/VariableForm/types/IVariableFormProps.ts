export interface IVariableFormProps {
  name: string;
  description: string;
  value: string;
  valuePlaceholder: string;
  note: string;
  isNameFocused: boolean;
  isValueFocused: boolean;
  onName: (name: string) => void;
  onDescription: (description: string) => void;
  onValue: (value: string) => void;
}
