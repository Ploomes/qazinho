import type { IntegrationId } from './IntegrationId';

/**
 * Um tracker conectado como a página pode vê-lo: como quem está logado, nunca o token; o
 * Jira também diz se o Confluence é usado ao lado dele.
 */
export interface IIntegrationStatus {
  id: IntegrationId;
  account: string;
  site: string | null;
  connectedAt: string;
  confluence?: boolean;
}
