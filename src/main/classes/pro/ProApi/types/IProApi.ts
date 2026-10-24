import type { ProFetcher } from './ProFetcher';

/** Where QAzinho Pro's API lives, and how to reach it. */
export interface IProApi {
  baseUrl: string;
  fetcher: ProFetcher;
}
