import type { ParseKeys } from 'i18next';

/** One thing the QA types to connect a tracker. */
export interface IIntegrationField {
  id: 'site' | 'email' | 'token';
  labelKey: ParseKeys;
  placeholder: string;
  isSecret: boolean;
}
