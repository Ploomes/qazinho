/** One thing a search list offers: what it is called, a word beside it, and a line under it. */
export interface ISearchListItem {
  id: string;
  label: string;
  tag: string | null;
  detail: string | null;
}
