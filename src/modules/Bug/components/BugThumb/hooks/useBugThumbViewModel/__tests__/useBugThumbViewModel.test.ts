// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useBugThumbViewModel } from '@/modules/Bug/components/BugThumb/hooks/useBugThumbViewModel';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';

beforeEach(() => {
  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    readShot: () => Promise.resolve('data:image/jpeg;base64,disk'),
  };
});

describe('useBugThumbViewModel', () => {
  it('shows the screen in hand', () => {
    const { result } = renderHook(() =>
      useBugThumbViewModel({ src: 'data:image/jpeg;base64,hand', file: null }),
    );

    expect(result.current).toEqual({
      shot: 'data:image/jpeg;base64,hand',
      hasShot: true,
    });
  });

  it('reads a screen kept on disk', async () => {
    const { result } = renderHook(() =>
      useBugThumbViewModel({ src: null, file: '/runs/r-01/2.jpg' }),
    );

    await waitFor(() => {
      expect(result.current.shot).toBe('data:image/jpeg;base64,disk');
    });
  });

  it('shows nothing for a bug with no screen', () => {
    expect(
      renderHook(() => useBugThumbViewModel({ src: null, file: null })).result.current
        .hasShot,
    ).toBe(false);
  });
});
