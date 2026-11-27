// @vitest-environment jsdom
import type { IProLink } from '@/shared/types';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LOGIN } from '@/modules/Assistant/library/__tests__/fixtures';
import { useProLinks } from '@/modules/Pro/hooks/useProLinks';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useAppStore, useProStore, useWorkspaceStore } from '@/store';

const LINK: IProLink = { orgSlug: 'loja', projectId: 'p-1', workspaceId: 'w-1' };

let waiting: IProLink | null = null;
let arrive: () => void = () => undefined;

const workspaceOf = (id: string) => ({ ...LOGIN, id, projectId: 'p-1' });

beforeEach(() => {
  waiting = null;
  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    takeProLink: () => {
      const link = waiting;

      waiting = null;

      return Promise.resolve(link);
    },
    onProLink: (listener) => {
      arrive = listener;

      return () => {
        arrive = () => undefined;
      };
    },
  };
  useProStore.setState({ link: null });
  useAppStore.setState({ selectedWorkspaceId: null });
  useWorkspaceStore.setState({ isLoaded: true, panelTab: 'device' });
});

afterEach(() => {
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useProLinks', () => {
  it('leaves a link where it is while the Pro is off', async () => {
    waiting = LINK;
    renderHook(() => useProLinks(false));

    await act(async () => {
      await Promise.resolve();
    });

    expect(waiting).toEqual(LINK);
    expect(useProStore.getState().link).toBeNull();
  });

  it('opens the plan of a link the app was started with, once the workspaces are read', async () => {
    useWorkspaceStore.setState({ isLoaded: false, workspaces: [] });
    waiting = LINK;
    const { rerender } = renderHook(() => useProLinks(true));

    expect(waiting).toEqual(LINK);

    act(() => {
      useWorkspaceStore.setState({ isLoaded: true });
      useWorkspaceStore.setState({ workspaces: [workspaceOf('w-1')] });
    });
    rerender();

    await waitFor(() => {
      expect(useAppStore.getState().selectedWorkspaceId).toBe('w-1');
    });
    expect(useWorkspaceStore.getState().panelTab).toBe('plan');
    expect(useProStore.getState().link).toBeNull();
  });

  it('keeps a link to a plan this computer does not hold, for the modal to offer it', async () => {
    useWorkspaceStore.setState({ workspaces: [] });
    renderHook(() => useProLinks(true));

    waiting = LINK;
    act(() => {
      arrive();
    });

    await waitFor(() => {
      expect(useProStore.getState().link).toEqual(LINK);
    });
    expect(useAppStore.getState().selectedWorkspaceId).toBeNull();
  });
});
