import type { IConfluenceSpace } from './IConfluenceSpace';
import type { JiraFailure } from './JiraFailure';

/**
 * Os espaços do Confluence em que o QA pode publicar, ou por que o Confluence não os
 * listou.
 */
export type ConfluenceSpaceList =
  | { isListed: true; spaces: IConfluenceSpace[] }
  | { isListed: false; failure: JiraFailure };
