import type { IIntegrationField } from './IIntegrationField';
import type { IntegrationId } from '@/shared/types';
import type { ParseKeys } from 'i18next';

/**
 * A tracker QAzinho connects to: through a form the QA fills, or through a CLI on this
 * machine, as GitHub goes through gh.
 */
export interface IIntegration {
  id: IntegrationId;
  name: string;
  logo: string;
  textKey: ParseKeys;
  needsKey: ParseKeys;
  via: 'form' | 'cli';
  tokenUrl: string | null;
  fields: IIntegrationField[];
}
