import type { JiraFetcher } from './JiraFetcher';
import type { IJiraCredentials } from '@/main/types';

export interface IJiraApi {
  credentials: () => Promise<IJiraCredentials | null>;
  fetcher: JiraFetcher;
}
