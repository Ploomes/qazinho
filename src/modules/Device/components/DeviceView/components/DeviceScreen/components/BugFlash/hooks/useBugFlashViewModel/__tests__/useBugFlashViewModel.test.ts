// @vitest-environment jsdom
import type { IBugFlash } from '@/modules/Device/types';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useBugFlashViewModel } from '@/modules/Device/components/DeviceView/components/DeviceScreen/components/BugFlash/hooks';
import { BUG_FLASH } from '@/modules/Device/constants';
import { useWorkspaceStore } from '@/store';

const flash = (id: string, more: Partial<IBugFlash> = {}): IBugFlash => ({
  id,
  bugId: `BUG-${id}`,
  shot: 'data:image/jpeg;base64,x',
  title: '',
  category: 'text',
  isDesign: false,
  isSeenAgain: false,
  isQuiet: false,
  ...more,
});

const queue = (flashes: IBugFlash[]) => {
  useWorkspaceStore.setState({ bugFlashes: { w1: flashes } });
};

const shown = () => useWorkspaceStore.getState().bugFlashes.w1?.map(({ id }) => id);

describe('useBugFlashViewModel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    useWorkspaceStore.setState({ bugFlashes: {} });
  });

  it('shows the oldest caught bug, then leaves for the next when its time is up', () => {
    queue([flash('a'), flash('b')]);

    const { result } = renderHook(() => useBugFlashViewModel({ workspaceId: 'w1' }));

    expect(result.current.flash?.id).toBe('a');

    act(() => {
      vi.advanceTimersByTime(BUG_FLASH.holdMs - 1);
    });

    expect(result.current.flash?.id).toBe('a');

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(result.current.flash?.id).toBe('b');
  });

  it('stays while the mouse is on it, and leaves after the mouse goes', () => {
    queue([flash('a')]);

    const { result } = renderHook(() => useBugFlashViewModel({ workspaceId: 'w1' }));

    act(() => {
      result.current.onHoldStart();
    });
    act(() => {
      vi.advanceTimersByTime(BUG_FLASH.holdMs * 3);
    });

    expect(shown()).toEqual(['a']);

    act(() => {
      result.current.onHoldEnd();
    });
    act(() => {
      vi.advanceTimersByTime(BUG_FLASH.holdMs);
    });

    expect(shown()).toEqual([]);
  });

  it('says the kind of bug big, and what it is under it', () => {
    queue([flash('a', { title: 'Botão diz Enviar' })]);

    const { result } = renderHook(() => useBugFlashViewModel({ workspaceId: 'w1' }));

    expect(result.current.headline).not.toBe('Botão diz Enviar');
    expect(result.current.detail).toBe('Botão diz Enviar');
  });

  it('says the title big when it has no kind to say', () => {
    queue([flash('a', { title: 'Botão diz Enviar', category: null })]);

    const { result } = renderHook(() => useBugFlashViewModel({ workspaceId: 'w1' }));

    expect(result.current.headline).toBe('Botão diz Enviar');
    expect(result.current.detail).toBeNull();
  });

  it('opens the bug in the Bugs tab when clicked', () => {
    queue([flash('a')]);
    useWorkspaceStore.setState({ openBugId: null, panelTab: 'device' });

    const { result } = renderHook(() => useBugFlashViewModel({ workspaceId: 'w1' }));

    act(() => {
      result.current.onOpen();
    });

    expect(useWorkspaceStore.getState().panelTab).toBe('bugs');
    expect(useWorkspaceStore.getState().openBugId).toBe('BUG-a');
  });

  it('has nothing to show with no workspace', () => {
    queue([flash('a')]);

    const { result } = renderHook(() => useBugFlashViewModel({ workspaceId: null }));

    expect(result.current.flash).toBeNull();
  });
});
