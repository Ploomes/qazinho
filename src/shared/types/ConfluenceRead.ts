import type { IConfluencePageRef } from './IConfluencePageRef';
import type { JiraFailure } from './JiraFailure';

/**
 * Uma página do Confluence lida para o agente, o corpo como Markdown, ou por que o
 * Confluence não a entregou, nas palavras dele.
 */
export type ConfluenceRead =
  | { isRead: true; page: IConfluencePageRef; text: string }
  | { isRead: false; failure: JiraFailure; said: string };
