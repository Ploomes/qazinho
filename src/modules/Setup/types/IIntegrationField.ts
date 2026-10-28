import type { ParseKeys } from 'i18next';

/** Uma coisa que o QA digita para conectar um tracker. */
export interface IIntegrationField {
  id: 'site' | 'email' | 'token';
  labelKey: ParseKeys;
  placeholder: string;
  isSecret: boolean;
}
