/**
 * Um plano que o QA pediu a partir de uma página do Confluence: o id, o título, o espaço,
 * e onde ela abre.
 */
export interface IConfluenceCommand {
  id: 'confluence-plan';
  pageId: string;
  title: string;
  space: string;
  url: string;
}
