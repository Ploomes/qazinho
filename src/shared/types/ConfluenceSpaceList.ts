import type { IConfluenceSpace } from './IConfluenceSpace';
import type { JiraFailure } from './JiraFailure';

/** The Confluence spaces the QA can publish in, or why Confluence did not list them. */
export type ConfluenceSpaceList =
  | { isListed: true; spaces: IConfluenceSpace[] }
  | { isListed: false; failure: JiraFailure };
