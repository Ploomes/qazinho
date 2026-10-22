import type { JiraApi } from '@/main/classes/integrations/JiraApi';

/** What filing a bug, and adding to its issue later, asks of Jira. */
export type IJiraFiling = Pick<
  JiraApi,
  'fileBug' | 'attach' | 'relate' | 'issue' | 'comment'
>;
