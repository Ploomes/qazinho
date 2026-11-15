// @vitest-environment jsdom
import type { IWindowDock } from '@/shared/types';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useWindowDock } from '@/shared/hooks/useWindowDock';
import { useAppStore } from '@/store';

/** Uma bridge cuja main encosta a janela quando o teste manda. */
function docking(start: IWindowDock | null) {
  let listener: ((dock: IWindowDock | null) => void) | null = null;

  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    windowDock: () => Promise.resolve(start),
    onWindowDock: (listen) => {
      listener = listen;

      return () => {
        listener = null;
      };
    },
  };

  return (dock: IWindowDock | null) => {
    listener?.(dock);
  };
}

beforeEach(() => {
  useAppStore.setState({ dock: null, selectedWorkspaceId: 'w0' });
});

afterEach(() => {
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useWindowDock', () => {
  it('shows the case once the main docks the window beside its Chrome', async () => {
    const dock = docking(null);

    renderHook(() => {
      useWindowDock();
    });
    await waitFor(() => {
      expect(useAppStore.getState().dock).toBeNull();
    });
    act(() => {
      dock({ workspaceId: 'w1' });
    });

    expect(useAppStore.getState()).toMatchObject({
      dock: { workspaceId: 'w1' },
      selectedWorkspaceId: 'w1',
    });

    act(() => {
      dock(null);
    });

    expect(useAppStore.getState().dock).toBeNull();
  });

  /** A página recarregada no meio de um caso à mão volta encostada, não à tela inteira. */
  it('picks up a dock that began before the page loaded', async () => {
    docking({ workspaceId: 'w1' });

    renderHook(() => {
      useWindowDock();
    });

    await waitFor(() => {
      expect(useAppStore.getState().dock).toEqual({ workspaceId: 'w1' });
    });
  });
});
