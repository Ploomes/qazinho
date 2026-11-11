// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useSiteIcons } from '@/modules/Project/hooks';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';

const ICON = 'data:image/png;base64,iVBORw==';

describe('useSiteIcons', () => {
  it('asks the main for the icon of each site, and hands each back by its address', async () => {
    const siteIcon = vi.fn((address: string) =>
      Promise.resolve(address.includes('loja') ? ICON : null),
    );

    window.qazinho = { ...fakeQazinhoApi('darwin'), siteIcon };

    const { result } = renderHook(() =>
      useSiteIcons(['https://loja.test/', 'https://blog.test/']),
    );

    await waitFor(() => {
      expect(result.current).toEqual({
        'https://loja.test/': ICON,
        'https://blog.test/': null,
      });
    });
  });

  /** A barra lateral desenha de novo a cada mudança de uma run: o site não é perguntado a cada vez. */
  it('asks once for an address, however many times the list is drawn', async () => {
    const siteIcon = vi.fn(() => Promise.resolve(ICON));

    window.qazinho = { ...fakeQazinhoApi('darwin'), siteIcon };

    const { result, rerender } = renderHook(
      (addresses: string[]) => useSiteIcons(addresses),
      { initialProps: ['https://loja.test/', 'https://loja.test/'] },
    );

    await waitFor(() => {
      expect(result.current['https://loja.test/']).toBe(ICON);
    });
    rerender(['https://loja.test/']);
    rerender(['https://loja.test/', 'https://loja.test/']);

    expect(siteIcon).toHaveBeenCalledTimes(1);
  });

  it('asks nothing while no project has a site', () => {
    const siteIcon = vi.fn(() => Promise.resolve(null));

    window.qazinho = { ...fakeQazinhoApi('darwin'), siteIcon };
    renderHook(() => useSiteIcons([]));

    expect(siteIcon).not.toHaveBeenCalled();
  });
});
