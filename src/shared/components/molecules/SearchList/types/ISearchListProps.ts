import type { ISearchListItem } from './ISearchListItem';

export interface ISearchListProps {
  query: string;
  label: string;
  placeholder: string;
  items: ISearchListItem[];
  note: string | null;
  emptyText: string;
  isOpen?: boolean;
  isAutoFocused?: boolean;
  onQuery: (query: string) => void;
  onPick: (id: string) => void;
  onEscape?: () => void;
}
