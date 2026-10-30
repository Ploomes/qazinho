import type { ISearchListProps } from '@/shared/components/molecules/SearchList/types';
import type { CSSProperties, KeyboardEvent } from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import { SEARCH_LIST } from '@/shared/components/molecules/SearchList/constants';

export const useSearchListViewModel = (props: ISearchListProps) => {
  const { query, items, onQuery, onPick, onEscape } = props;
  const listId = useId();
  const listRef = useRef<HTMLUListElement>(null);
  const foldRef = useRef<HTMLDivElement>(null);
  const [highlight, setHighlight] = useState(0);
  const [isFocused, setFocused] = useState(props.isAutoFocused === true);
  const plain = (text: string) =>
    text
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase();
  const terms = plain(query)
    .split(/\s+/)
    .filter((term) => term !== '');
  const shown = items
    .filter((item) => {
      const text = plain(`${item.label} ${item.tag ?? ''} ${item.detail ?? ''}`);

      return terms.every((term) => text.includes(term));
    })
    .slice(0, SEARCH_LIST.limit);
  const active = Math.min(highlight, Math.max(0, shown.length - 1));
  const isSearching = terms.length > 0;
  const isOpen = props.isOpen === true || isFocused || isSearching;

  useEffect(() => {
    listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const pick = (id: string) => {
    onPick(id);
    setHighlight(0);
  };

  return {
    listId,
    listRef,
    foldRef,
    style: {
      '--search-list-row': `${String(SEARCH_LIST.rowHeight)}px`,
      '--search-list-rows': String(SEARCH_LIST.maxRows),
    } as CSSProperties,
    isOpen,
    message: props.note ?? (shown.length === 0 && isSearching ? props.emptyText : null),
    rows: shown.map((item, index) => ({
      ...item,
      isActive: index === active,
      className:
        index === active
          ? 'search-list__item search-list__item--active'
          : 'search-list__item',
    })),
    onChange: (value: string) => {
      onQuery(value);
      setHighlight(0);
    },
    onFocus: () => {
      setFocused(true);
    },
    onBlur: () => {
      setFocused(false);
    },
    onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => {
      const count = shown.length;

      if (event.key === 'ArrowDown' && count > 0) {
        event.preventDefault();
        setHighlight((active + 1) % count);
      } else if (event.key === 'ArrowUp' && count > 0) {
        event.preventDefault();
        setHighlight((active - 1 + count) % count);
      } else if (event.key === 'Enter') {
        const row = shown[active];

        if (row === undefined) return;

        event.preventDefault();
        pick(row.id);
      } else if (event.key === 'Escape' && (onEscape !== undefined || isOpen)) {
        event.preventDefault();
        event.stopPropagation();

        if (onEscape !== undefined) onEscape();
        else {
          onQuery('');
          event.currentTarget.blur();
        }
      }
    },
    onHighlight: (index: number) => {
      setHighlight(index);
    },
    onFoldDone: () => {
      if (isOpen)
        foldRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    },
    onPickRow: pick,
  };
};
