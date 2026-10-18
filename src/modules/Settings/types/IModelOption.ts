import type { ParseKeys } from 'i18next';

export interface IModelOption {
  id: string;
  name: string;
  noteKey: ParseKeys;
  isLocked: boolean;
}
