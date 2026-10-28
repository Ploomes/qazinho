import type { ProFetcher } from './ProFetcher';

/** Onde a API do QAzinho Pro vive, e como alcançá-la. */
export interface IProApi {
  baseUrl: string;
  fetcher: ProFetcher;
}
