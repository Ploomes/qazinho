import type { IIntegrationField } from './IIntegrationField';
import type { IntegrationId } from '@/shared/types';
import type { ParseKeys } from 'i18next';

/**
 * Um tracker a que o QAzinho se conecta: por um formulário que o QA preenche, ou por uma
 * CLI nesta máquina, como o GitHub passa pelo gh.
 */
export interface IIntegration {
  id: IntegrationId;
  name: string;
  logo: string;
  textKey: ParseKeys;
  via: 'form' | 'cli';
  tokenUrl: string | null;
  fields: IIntegrationField[];
}
