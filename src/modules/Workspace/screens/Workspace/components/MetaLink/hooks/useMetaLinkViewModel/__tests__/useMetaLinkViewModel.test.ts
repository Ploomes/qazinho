// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useMetaLinkViewModel } from '@/modules/Workspace/screens/Workspace/components/MetaLink/hooks/useMetaLinkViewModel';

const LINK = { href: 'https://shop.atlassian.net/browse/SHOP-12', title: 'Coupon' };

describe('useMetaLinkViewModel', () => {
  describe('canDrop', () => {
    /** A história não se solta do cabeçalho: só o design tem um botão para isso. */
    it('does NOT offer to drop a link nobody can drop', () => {
      expect(renderHook(() => useMetaLinkViewModel(LINK)).result.current.canDrop).toBe(
        false,
      );
    });

    it('offers to drop a link that can be dropped, saying what it does', () => {
      const { result } = renderHook(() =>
        useMetaLinkViewModel({ ...LINK, dropLabel: 'Stop checking', onDrop: vi.fn() }),
      );

      expect(result.current).toMatchObject({ canDrop: true, dropLabel: 'Stop checking' });
    });
  });

  describe('onDropClick', () => {
    it('drops the link', () => {
      const onDrop = vi.fn();
      const { result } = renderHook(() => useMetaLinkViewModel({ ...LINK, onDrop }));

      act(() => {
        result.current.onDropClick();
      });

      expect(onDrop).toHaveBeenCalledOnce();
    });
  });
});
