// @vitest-environment jsdom
import type { ISearchListProps } from '@/shared/components/molecules/SearchList/types';
import type { KeyboardEvent } from 'react';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useSearchListViewModel } from '@/shared/components/molecules/SearchList/hooks/useSearchListViewModel';

const ITEMS = [
  {
    id: 'acme/loja-web',
    label: 'acme/loja-web',
    tag: 'private',
    detail: 'A loja na web',
  },
  {
    id: 'acme/loja-api',
    label: 'acme/loja-api',
    tag: null,
    detail: 'Serviço de pedidos',
  },
  { id: 'acme/infra', label: 'acme/infra', tag: null, detail: null },
];

function list(extra: Partial<ISearchListProps> = {}) {
  const props: ISearchListProps = {
    query: '',
    label: 'Search',
    placeholder: 'Search',
    items: ITEMS,
    note: null,
    emptyText: 'Nothing matches.',
    onQuery: vi.fn(),
    onPick: vi.fn(),
    ...extra,
  };

  return { props, ...renderHook(() => useSearchListViewModel(props)) };
}

function key(name: string) {
  return {
    key: name,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  } as unknown as KeyboardEvent<HTMLInputElement>;
}

describe('useSearchListViewModel', () => {
  it('shows every item until the QA types, then only what holds every word typed', () => {
    expect(list().result.current.rows).toHaveLength(3);
    expect(
      list({ query: 'loja pedidos' }).result.current.rows.map(({ id }) => id),
    ).toEqual(['acme/loja-api']);
  });

  it('matches without caring for accents or case', () => {
    expect(list({ query: 'SERVICO' }).result.current.rows.map(({ id }) => id)).toEqual([
      'acme/loja-api',
    ]);
  });

  it('says nothing matches only once the QA typed, and a note always wins', () => {
    expect(list({ query: 'zzz' }).result.current.message).toBe('Nothing matches.');
    expect(list({ items: [] }).result.current.message).toBeNull();
    expect(list({ query: 'zzz', note: 'Reading…' }).result.current.message).toBe(
      'Reading…',
    );
  });

  describe('onKeyDown', () => {
    it('moves the highlight down and around, and picks it on Enter', () => {
      const { result, props } = list();

      act(() => {
        result.current.onKeyDown(key('ArrowDown'));
      });
      act(() => {
        result.current.onKeyDown(key('ArrowDown'));
      });
      act(() => {
        result.current.onKeyDown(key('ArrowDown'));
      });

      expect(result.current.rows.findIndex(({ isActive }) => isActive)).toBe(0);

      act(() => {
        result.current.onKeyDown(key('ArrowUp'));
      });
      act(() => {
        result.current.onKeyDown(key('Enter'));
      });

      expect(props.onPick).toHaveBeenCalledWith('acme/infra');
    });

    it('does NOT pick anything on Enter when nothing is shown', () => {
      const { result, props } = list({ query: 'zzz' });
      const enter = key('Enter');

      act(() => {
        result.current.onKeyDown(enter);
      });

      expect(props.onPick).not.toHaveBeenCalled();
      expect(enter.preventDefault).not.toHaveBeenCalled();
    });

    it('hands Escape to whoever asked for it, and to no one else', () => {
      const onEscape = vi.fn();
      const escape = key('Escape');
      const asked = list({ onEscape });

      act(() => {
        asked.result.current.onKeyDown(escape);
      });

      expect(onEscape).toHaveBeenCalledTimes(1);
      expect(escape.stopPropagation).toHaveBeenCalled();

      const free = key('Escape');
      const unasked = list();

      act(() => {
        unasked.result.current.onKeyDown(free);
      });

      expect(free.stopPropagation).not.toHaveBeenCalled();
    });

    /**
     * Depois de pôr um repositório a lista seguia aberta, e o Esc para fechá-la fechava a
     * janela do projeto inteira, com o que o QA tinha digitado.
     */
    it('closes an open list on Escape without closing the window around it', () => {
      const escape = key('Escape');
      const blur = vi.fn();
      const open = list({ query: 'loja' });

      act(() => {
        open.result.current.onKeyDown({
          ...escape,
          currentTarget: { blur },
        } as unknown as KeyboardEvent<HTMLInputElement>);
      });

      expect(escape.stopPropagation).toHaveBeenCalled();
      expect(open.props.onQuery).toHaveBeenCalledWith('');
      expect(blur).toHaveBeenCalled();
    });
  });

  it('opens while focused or searching, or when told to stay open', () => {
    const { result } = list();

    expect(result.current.isOpen).toBe(false);

    act(() => {
      result.current.onFocus();
    });

    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.onBlur();
    });

    expect(result.current.isOpen).toBe(false);
    expect(list({ query: 'loja' }).result.current.isOpen).toBe(true);
    expect(list({ isOpen: true }).result.current.isOpen).toBe(true);
  });
});
