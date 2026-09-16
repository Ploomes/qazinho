// @vitest-environment jsdom
import { useWorkspaceTabsViewModel } from '@/modules/Workspace/screens/Workspace/components/WorkspaceTabs/hooks/useWorkspaceTabsViewModel';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const PROPS = {
  current: 'plan' as const,
  planCount: 4,
  runCount: 1,
  bugCount: 0,
  onSelect: vi.fn(),
};

describe('useWorkspaceTabsViewModel', () => {
  describe('items', () => {
    it('marks the tab the workspace is on, and only that one', () => {
      const { result } = renderHook(() => useWorkspaceTabsViewModel(PROPS));

      expect(result.current.items.filter(({ isActive }) => isActive)).toHaveLength(1);
      expect(result.current.items.find(({ isActive }) => isActive)?.id).toBe('plan');
    });

    it('counts what each tab holds', () => {
      const { result } = renderHook(() => useWorkspaceTabsViewModel(PROPS));

      expect(result.current.items.map(({ badge }) => badge)).toEqual(['', '4', '1', '0']);
    });

    it('never badges the chat, because a conversation has no count worth reading', () => {
      const { result } = renderHook(() => useWorkspaceTabsViewModel(PROPS));

      expect(result.current.items[0]?.badge).toBe('');
    });
  });
});
