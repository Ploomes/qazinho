import type { IIntegrationField } from './IIntegrationField';
import type { IntegrationId } from '@/types';
import type { ParseKeys } from 'i18next';

/** An issue tracker QAzinho can connect to, what it asks for, and where the QA makes a token. */
export interface IIntegration {
  id: IntegrationId;
  name: string;
  logo: string;
  textKey: ParseKeys;
  needsKey: ParseKeys;
  tokenUrl: string;
  fields: IIntegrationField[];
}
