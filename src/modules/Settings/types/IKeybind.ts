import type { ParseKeys } from 'i18next';

export interface IKeybind {
  id: string;
  labelKey: ParseKeys;
  combo: string;
}
