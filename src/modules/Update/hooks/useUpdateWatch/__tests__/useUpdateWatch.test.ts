// @vitest-environment jsdom
import type { AppUpdate } from '@/shared/types';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useUpdateWatch } from '@/modules/Update/hooks/useUpdateWatch';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { NO_UPDATE } from '@/services/Updates';
import { useUpdateStore } from '@/store';

const READY: AppUpdate = { phase: 'ready', version: '0.2.0', isRequired: false };

beforeEach(() => {
  useUpdateStore.setState({ update: NO_UPDATE });
});

afterEach(() => {
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useUpdateWatch', () => {
  // A main pode já ter baixado tudo antes de a página abrir: um evento perdido não pode esconder isso.
  it('reads where the update stands when the page opens', async () => {
    window.qazinho = {
      ...fakeQazinhoApi('darwin'),
      appUpdate: () => Promise.resolve(READY),
    };

    renderHook(() => useUpdateWatch());

    await waitFor(() => {
      expect(useUpdateStore.getState().update).toEqual(READY);
    });
  });

  it('follows what the main says next, and stops when it unmounts', async () => {
    let tell: (update: AppUpdate) => void = () => undefined;
    const off = vi.fn();

    window.qazinho = {
      ...fakeQazinhoApi('darwin'),
      onAppUpdate: (listener) => {
        tell = listener;

        return off;
      },
    };

    const { unmount } = renderHook(() => useUpdateWatch());

    await act(async () => {
      await new Promise((settle) => setTimeout(settle));
      tell(READY);
    });

    expect(useUpdateStore.getState().update).toEqual(READY);

    unmount();

    expect(off).toHaveBeenCalledOnce();
  });
});
