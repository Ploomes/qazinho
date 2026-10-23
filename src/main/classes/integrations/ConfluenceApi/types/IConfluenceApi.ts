import type { JiraFetcher } from '@/main/classes/integrations/JiraApi/types';
import type { IJiraCredentials } from '@/main/types';

export interface IConfluenceApi {
  credentials: () => Promise<IJiraCredentials | null>;
  jira: () => Promise<IJiraCredentials | null>;
  fetcher: JiraFetcher;
}
