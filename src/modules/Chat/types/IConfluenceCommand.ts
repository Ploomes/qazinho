/**
 * A plan the QA asked for from a Confluence page: its id, its title, its space, and where
 * it opens.
 */
export interface IConfluenceCommand {
  id: 'confluence-plan';
  pageId: string;
  title: string;
  space: string;
  url: string;
}
