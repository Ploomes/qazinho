// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { i18n } from '@/languages';
import { usePublishModalViewModel } from '@/modules/Plan/screens/Plan/components/PublishModal/hooks/usePublishModalViewModel';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';

const SPACES = {
  isListed: true as const,
  spaces: [
    { id: '9', key: 'QA', name: 'Quality' },
    { id: '10', key: 'ENG', name: 'Engineering' },
  ],
};

const PAGES = {
  isListed: true as const,
  pages: [
    { id: '5', title: 'Checkout', space: 'Quality', url: 'https://acme/wiki/5' },
    { id: '6', title: 'Checkout API', space: 'Engineering', url: 'https://acme/wiki/6' },
  ],
};

function modal(onConfirm = vi.fn()) {
  return {
    onConfirm,
    ...renderHook(() =>
      usePublishModalViewModel({
        title: 'Test plan · Checkout',
        onCancel: vi.fn(),
        onConfirm,
      }),
    ),
  };
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    listConfluenceSpaces: vi.fn().mockResolvedValue(SPACES),
    searchConfluence: vi.fn().mockResolvedValue(PAGES),
  };
});

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window, 'qazinho');
});

describe('usePublishModalViewModel', () => {
  describe('onPickSpace', () => {
    it('lists the spaces, and offers the pages of the one picked to go under', async () => {
      const { result } = modal();

      expect(result.current.spaceSearch.note).toBe('Reading your spaces…');
      await waitFor(() => {
        expect(result.current.spaceSearch.items.map(({ label }) => label)).toEqual([
          'Quality',
          'Engineering',
        ]);
      });
      expect(result.current.hasParentSearch).toBe(false);

      act(() => {
        result.current.onPickSpace('9');
      });

      expect(result.current.space).toEqual({ id: '9', label: 'Quality', detail: 'QA' });
      await waitFor(() => {
        expect(result.current.parentSearch.items.map(({ id }) => id)).toEqual(['5']);
      });
    });

    it('says why Confluence would not list the spaces', async () => {
      window.qazinho.listConfluenceSpaces = vi
        .fn()
        .mockResolvedValue({ isListed: false, failure: 'unauthorized' });

      const { result } = modal();

      await waitFor(() => {
        expect(result.current.spaceSearch.note).toBe(
          'Confluence refused this Jira account. Check that it can open Confluence on the same site.',
        );
      });
    });
  });

  describe('onConfirm', () => {
    it('hands over the space, the parent page and the title typed', async () => {
      const { result, onConfirm } = modal();

      await waitFor(() => {
        expect(result.current.spaceSearch.items).toHaveLength(2);
      });
      act(() => {
        result.current.onPickSpace('9');
      });
      await waitFor(() => {
        expect(result.current.parentSearch.items).toHaveLength(1);
      });
      act(() => {
        result.current.onPickParent('5');
        result.current.onTitle('  Coupon plan ');
      });
      act(() => {
        result.current.onConfirm();
      });

      expect(onConfirm).toHaveBeenCalledWith({
        spaceId: '9',
        parentId: '5',
        title: 'Coupon plan',
      });
    });

    it('does NOT confirm with no space, nor with no title', async () => {
      const { result, onConfirm } = modal();

      expect(result.current.canConfirm).toBe(false);
      act(() => {
        result.current.onConfirm();
      });

      await waitFor(() => {
        expect(result.current.spaceSearch.items).toHaveLength(2);
      });
      act(() => {
        result.current.onPickSpace('10');
        result.current.onTitle(' ');
      });

      expect(result.current.canConfirm).toBe(false);
      expect(onConfirm).not.toHaveBeenCalled();

      act(() => {
        result.current.onTitle('Plan');
      });

      expect(result.current.canConfirm).toBe(true);
    });
  });
});
