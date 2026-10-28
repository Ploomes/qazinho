/**
 * Uma coisa que uma lista de busca oferece: como se chama, uma palavra ao lado, e uma
 * linha embaixo.
 */
export interface ISearchListItem {
  id: string;
  label: string;
  tag: string | null;
  detail: string | null;
}
