import type { IIntegrationStatus } from './IIntegrationStatus';
import type { JiraFailure } from './JiraFailure';

/**
 * O Confluence ligado ou desligado ao lado do Jira, com o status do Jira como está agora,
 * ou por que o Confluence não pôde ser ligado.
 */
export type ConfluenceSwitch =
  | { isSwitched: true; status: IIntegrationStatus }
  | { isSwitched: false; failure: JiraFailure; said: string };
