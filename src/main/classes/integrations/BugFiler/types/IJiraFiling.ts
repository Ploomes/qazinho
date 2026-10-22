import type { JiraApi } from '@/main/classes/integrations/JiraApi';

/** What filing a bug asks of Jira. */
export type IJiraFiling = Pick<JiraApi, 'fileBug' | 'attach' | 'relate'>;
