import type { IBoardColumn } from './IBoardColumn';
import type { JiraFailure } from './JiraFailure';

/** As colunas de um board do Jira, ou por que o Jira não as listou. */
export type BoardColumnList =
  { isListed: true; columns: IBoardColumn[] } | { isListed: false; failure: JiraFailure };
