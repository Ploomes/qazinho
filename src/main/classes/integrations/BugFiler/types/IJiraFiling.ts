import type { JiraApi } from '@/main/classes/integrations/JiraApi';

/** O que registrar um bug, e acrescentar à issue dele depois, pede ao Jira. */
export type IJiraFiling = Pick<
  JiraApi,
  'fileBug' | 'attach' | 'relate' | 'issue' | 'comment'
>;
