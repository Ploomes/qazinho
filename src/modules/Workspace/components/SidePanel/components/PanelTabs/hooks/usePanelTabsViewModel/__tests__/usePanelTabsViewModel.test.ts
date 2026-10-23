// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { usePanelTabsViewModel } from '@/modules/Workspace/components/SidePanel/components/PanelTabs/hooks/usePanelTabsViewModel';

const PROPS = {
  current: 'plan' as const,
  planCount: 4,
  runCount: 1,
  bugCount: 0,
  isLive: false,
  onSelect: vi.fn(),
};

describe('usePanelTabsViewModel', () => {
  describe('items', () => {
    it('marks the tab the panel is on, and only that one', () => {
      const { result } = renderHook(() => usePanelTabsViewModel(PROPS));

      expect(result.current.items.filter(({ isActive }) => isActive)).toHaveLength(1);
      expect(result.current.items.find(({ isActive }) => isActive)?.id).toBe('plan');
    });

    it('lists the plan, the device, the runs and the bugs, counting what each holds', () => {
      const { result } = renderHook(() => usePanelTabsViewModel(PROPS));

      expect(result.current.items.map(({ id, badge }) => [id, badge])).toEqual([
        ['plan', '4'],
        ['device', ''],
        ['runs', '1'],
        ['bugs', '0'],
      ]);
    });

    it('marks the device live while a run drives it, and nothing else', () => {
      const { result } = renderHook(() =>
        usePanelTabsViewModel({ ...PROPS, isLive: true }),
      );

      expect(
        result.current.items.filter(({ isLive }) => isLive).map(({ id }) => id),
      ).toEqual(['device']);
    });

    it('does NOT mark the device live with no run going', () => {
      const { result } = renderHook(() => usePanelTabsViewModel(PROPS));

      expect(result.current.items.some(({ isLive }) => isLive)).toBe(false);
    });
  });

  it('names the tab list, so a screen reader says what the tabs are for', () => {
    expect(renderHook(() => usePanelTabsViewModel(PROPS)).result.current.tabsLabel).toBe(
      'Workspace sections',
    );
  });
});
