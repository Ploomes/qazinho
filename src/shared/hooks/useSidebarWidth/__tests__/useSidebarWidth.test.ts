// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SHELL } from '@/shared/constants';
import { useSidebarWidth } from '@/shared/hooks/useSidebarWidth';
import { useSettingsStore } from '@/store';

describe('useSidebarWidth', () => {
  it('stands as wide as the rail and the list while open, and as the rail once folded', () => {
    useSettingsStore.setState({ isSidebarShut: false });

    const { result } = renderHook(() => useSidebarWidth());

    expect(result.current).toBe(SHELL.sidebarRail + SHELL.sidebarWidth);

    act(() => {
      useSettingsStore.getState().toggleSidebar();
    });

    expect(result.current).toBe(SHELL.sidebarRail);
  });
});
