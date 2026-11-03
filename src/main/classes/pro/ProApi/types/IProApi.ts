import type { ProFetcher } from './ProFetcher';

/**
 * Onde a API do QAzinho Pro vive, como alcançá-la, e o que fazer quando ela recusa esta
 * versão.
 */
export interface IProApi {
  baseUrl: string;
  fetcher: ProFetcher;
  version: string;
  onUpdateRequired: () => void;
}
