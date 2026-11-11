// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useRailFlyoutViewModel } from '@/app/components/Sidebar/components/RailFlyout/hooks/useRailFlyoutViewModel';

const FLYOUT = {
  projectId: 'p1',
  name: 'Loja',
  place: 'loja.test',
  mark: { kind: 'initial' as const, initial: 'L' },
  plans: [],
  top: 120,
  left: 64,
};

describe('useRailFlyoutViewModel', () => {
  it('hands the stylesheet where the panel opens, beside the icon it came from', () => {
    expect(
      renderHook(() => useRailFlyoutViewModel({ flyout: FLYOUT })).result.current,
    ).toEqual({
      style: { '--flyout-top': '120px', '--flyout-left': '64px' },
    });
  });
});
