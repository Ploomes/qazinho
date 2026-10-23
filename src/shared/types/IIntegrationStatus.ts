import type { IntegrationId } from './IntegrationId';

/** A connected tracker as the page may see it: who it is signed in as, never the token; Jira also says whether Confluence is used beside it. */
export interface IIntegrationStatus {
  id: IntegrationId;
  account: string;
  site: string | null;
  connectedAt: string;
  confluence?: boolean;
}
